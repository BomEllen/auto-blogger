const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_MODEL, FALLBACK_MODEL, withTimeout, withRetry, withFallback, friendlyGeminiError } = require('../lib/ai');
const store = require('../lib/revisionStore');

const router = express.Router();

const BLOG_TYPE_LABEL = { info: '정보성 블로그', review: '리뷰 블로그' };
const GUIDE_FILES = {
  info: path.join(__dirname, '../prompts/info-blog-guide.md'),
  review: path.join(__dirname, '../prompts/review-blog-guide.md'),
};

let ANALYSIS_GUIDE = '';
try {
  ANALYSIS_GUIDE = fs.readFileSync(path.join(__dirname, '../prompts/revision-analysis-guide.md'), 'utf-8').trim();
} catch {
  // 파일 없으면 무시
}

function readGuide(blogType) {
  try {
    return fs.readFileSync(GUIDE_FILES[blogType] || GUIDE_FILES.info, 'utf-8').trim();
  } catch {
    return '';
  }
}

function isValidBlogType(t) {
  return t === 'info' || t === 'review';
}

// ── 최종본 저장 (원본 + 최종본 + 메모 한 쌍) ──
router.post('/revisions', (req, res) => {
  const { blogType, title, subtitle, memo, original, final } = req.body || {};
  if (!isValidBlogType(blogType)) return res.status(400).json({ error: 'blogType이 올바르지 않습니다.' });
  if (!original?.trim() || !final?.trim()) return res.status(400).json({ error: '원본과 최종본이 모두 필요합니다.' });

  const record = store.save({
    blogType,
    createdAt: new Date().toISOString(),
    title: title?.trim() || '(제목 없음)',
    subtitle: subtitle?.trim() || '',
    memo: memo?.trim() || '',
    original: original.trim(),
    final: final.trim(),
    status: 'pending',
    analyzedAt: null,
    analysisSummary: null,
    exampleCandidate: null,
    purgedAt: null,
  });
  res.json({ id: record.id });
});

// ── 목록 (메타데이터만 — 원본/최종본 본문은 제외) ──
router.get('/revisions', (req, res) => {
  const { blogType } = req.query;
  const records = store
    .list(isValidBlogType(blogType) ? blogType : undefined)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const items = records.map(({ original, final, ...meta }) => ({
    ...meta,
    hasText: Boolean(original && final),
  }));
  res.json({ items });
});

// ── 퇴고 분석 ──
router.post('/revisions/analyze', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });

  const { blogType } = req.body || {};
  if (!isValidBlogType(blogType)) return res.status(400).json({ error: 'blogType이 올바르지 않습니다.' });

  const all = store.list(blogType);
  const pending = all.filter((r) => r.status === 'pending' && r.original && r.final);

  if (pending.length < 3) {
    return res.status(400).json({
      error: `데이터 부족 — ${pending.length}/3쌍. 최종본을 3개 이상 저장하면 분석할 수 있어요.`,
      count: pending.length,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const guide = readGuide(blogType);

    const pairsBlock = pending
      .map(
        (r, i) => `[쌍 ${i + 1}] id=${r.id} / 제목: ${r.title}
[원본]
${r.original}

[최종본]
${r.final}

[수정 메모] ${r.memo || '없음'}`
      )
      .join('\n\n---\n\n');

    const prompt = `[글 유형]\n${BLOG_TYPE_LABEL[blogType]}\n\n[현재 가이드 — 이 가이드로 생성된 글들의 수정 전/후 쌍이다]\n${guide}\n\n[수정 쌍 ${pending.length}개]\n${pairsBlock}\n\n위 ${pending.length}개 쌍을 분석하세요.`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: ANALYSIS_GUIDE });
    const result = await withFallback(
      () => withRetry(() => withTimeout(() => model.generateContent(prompt), 90000)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: ANALYSIS_GUIDE });
        return withRetry(() => withTimeout(() => fb.generateContent(prompt), 90000), 2, 2000);
      }
    );

    const text = result.response.text().trim();
    const extract = (tag) => {
      const m = text.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`));
      return m ? m[1].trim() : '';
    };
    const report = extract('REPORT');
    const summaryBlock = extract('SUMMARY');
    const exampleBlock = extract('EXAMPLE_CANDIDATES');

    if (!report) {
      return res.status(500).json({ error: '분석 리포트 생성에 실패했어요. 다시 시도해주세요.' });
    }

    const summaryMap = {};
    summaryBlock.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const m = line.match(/^([\w-]+)\s*\/\s*(.+)$/);
      if (m) summaryMap[m[1]] = m[2].trim();
    });

    const exampleMap = {};
    exampleBlock.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const m = line.match(/^([\w-]+)\s*\/\s*(\d+)\s*\/\s*(.+)$/);
      if (m) exampleMap[m[1]] = { score: parseInt(m[2], 10), reason: m[3].trim() };
    });

    const now = new Date().toISOString();
    pending.forEach((r) => {
      store.update(r.id, {
        status: 'analyzed',
        analyzedAt: now,
        analysisSummary: summaryMap[r.id] || null,
        exampleCandidate: exampleMap[r.id] || null,
      });
    });

    res.json({ report, analyzedCount: pending.length, analyzedIds: pending.map((r) => r.id) });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  }
});

// ── 분석 완료 쌍의 원문(원본·최종본)만 삭제 — 메타데이터는 유지 ──
router.post('/revisions/purge', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '선택된 항목이 없습니다.' });
  }

  const purgedAt = new Date().toISOString();
  let purged = 0;
  const skipped = [];
  for (const id of ids) {
    const rec = store.get(id);
    if (!rec) { skipped.push(id); continue; }
    if (rec.status !== 'analyzed') { skipped.push(id); continue; } // 분석 안 된 쌍은 원문 보호
    store.update(id, { original: null, final: null, status: 'purged', purgedAt });
    purged++;
  }
  res.json({ purged, skipped });
});

// ── 전체 내보내기 (볼륨 백업용) ──
router.get('/revisions/export', (req, res) => {
  const items = store.list();
  res.json({ exportedAt: new Date().toISOString(), count: items.length, items });
});

// ── 가져오기 (복원 — id 기준 upsert) ──
router.post('/revisions/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: '형식이 올바르지 않습니다. { items: [...] } 구조여야 해요.' });

  let imported = 0;
  const errors = [];
  items.forEach((item, i) => {
    if (!item?.id || !isValidBlogType(item.blogType)) { errors.push(`${i}번째 항목: id 또는 blogType 누락`); return; }
    store.save(item);
    imported++;
  });
  res.json({ imported, total: items.length, errors });
});

module.exports = router;
