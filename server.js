require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

let STYLE_SAMPLES = '';
try {
  const raw = fs.readFileSync(path.join(__dirname, 'style-samples.txt'), 'utf-8').trim();
  // 안내 헤더와 빈 예시 placeholder는 제외하고 실제 글만 추출
  const blocks = raw.split('=====').map(b => b.trim()).filter(b => b && !b.startsWith('아래 글들을') && !b.startsWith('(여기에'));
  if (blocks.length > 0) STYLE_SAMPLES = blocks.join('\n\n=====\n\n');
} catch {
  // 파일 없으면 무시
}
console.log(`[config] Gemini 모델: ${GEMINI_MODEL}`);

const app = express();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 61 },
});

app.use(express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`[${req.method}] ${req.path}`);
  next();
});

// ✏️  리뷰 블로그 가이드: review-blog-guide.md
// ✏️  정보성 블로그 가이드: info-blog-guide.md
let STYLE_GUIDE = '';
try {
  STYLE_GUIDE = fs.readFileSync(path.join(__dirname, 'review-blog-guide.md'), 'utf-8').trim();
} catch {
  // 파일 없으면 무시
}

function getCategoryName(category) {
  return { cafe: '카페', restaurant: '음식점', accommodation: '숙소', etc: '기타' }[category] || '';
}

function getExtractionFields(category) {
  if (category === 'cafe') return `{ "name": "카페명", "location": "주소 또는 위치", "hours": "영업시간", "parking": "주차 가능/불가/인근 유료주차 중 하나", "amenities": "편의시설 (와이파이/콘센트/테라스 등 쉼표 구분)" }`;
  if (category === 'restaurant') return `{ "name": "식당명", "location": "주소 또는 위치", "hours": "영업시간", "menu": "대표메뉴와 가격", "reservation": "예약 필수/예약 가능/예약 불필요 중 하나", "parking": "주차 가능/불가/인근 유료주차 중 하나" }`;
  if (category === 'accommodation') return `{ "name": "숙소명", "location": "주소 또는 위치", "price": "1박 가격", "checkin": "체크인 시간", "checkout": "체크아웃 시간", "phone": "전화번호" }`;
  if (category === 'etc') return `{ "name": "장소 이름", "location": "주소 또는 위치", "hours": "영업시간", "parking": "주차 가능/불가/인근 유료주차 중 하나", "extra": "기타 정보" }`;
  return '{}';
}

function buildCategoryInfoText(category, info) {
  if (category === 'cafe') return `카페 정보:\n- 카페명: ${info.name}\n- 위치: ${info.location}\n- 영업시간: ${info.hours || '미입력'}\n- 주차: ${info.parking || '미입력'}\n- 편의시설: ${info.amenities || '미입력'}`;
  if (category === 'restaurant') return `음식점 정보:\n- 식당명: ${info.name}\n- 위치: ${info.location}\n- 영업시간: ${info.hours || '미입력'}\n- 대표메뉴 및 가격: ${info.menu || '미입력'}\n- 예약: ${info.reservation || '미입력'}\n- 주차: ${info.parking || '미입력'}`;
  if (category === 'accommodation') return `숙소 정보:\n- 숙소명: ${info.name}\n- 위치: ${info.location}\n- 1박 가격: ${info.price || '미입력'}\n- 체크인: ${info.checkin || '미입력'}\n- 체크아웃: ${info.checkout || '미입력'}\n- 전화번호: ${info.phone || '미입력'}`;
  if (category === 'etc') return `장소 정보:\n- 장소명: ${info.name}\n- 위치: ${info.location}\n- 영업시간: ${info.hours || '미입력'}\n- 주차: ${info.parking || '미입력'}\n- 기타 정보: ${info.extra || '미입력'}`;
  return '';
}

function generateStars(rating) {
  const n = parseFloat(rating) || 4.5;
  const full = Math.floor(n);
  const half = n % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⭐' : '') + '☆'.repeat(empty);
}

function parseBlogResponse(text) {
  const extract = (tag) => {
    const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`);
    const m = text.match(re);
    return m ? m[1].trim() : '';
  };
  const hashtagsRaw = extract('HASHTAGS');
  const hashtags = hashtagsRaw
    .split(/\s+/)
    .filter((t) => t.startsWith('#') && t.length > 1);
  return {
    title: extract('TITLE'),
    body: extract('BODY'),
    hashtags,
  };
}

function validateBlogOutput(parsed, photoCount) {
  const violations = [];

  // 사진 마커 순서 검증
  const markers = [...(parsed.body || '').matchAll(/\[사진(\d+)\]/g)].map((m) => parseInt(m[1]));
  for (let i = 0; i < markers.length - 1; i++) {
    if (markers[i] >= markers[i + 1]) {
      violations.push(`사진 마커 순서 위반 (${markers.join('→')}) — [사진1]부터 오름차순으로`);
      break;
    }
  }

  // 사진 마커 개수 검증 — 제공된 사진 수와 마커 수가 일치해야 함
  if (photoCount > 0) {
    if (markers.length !== photoCount) {
      violations.push(`사진 마커 ${markers.length}개 — 제공된 사진 ${photoCount}장과 불일치. [사진1]~[사진${photoCount}] 모두 등장해야 함`);
    } else {
      // 1~N이 빠짐없이 있는지 확인
      const markerSet = new Set(markers);
      const missing = [];
      for (let i = 1; i <= photoCount; i++) { if (!markerSet.has(i)) missing.push(i); }
      if (missing.length > 0) {
        violations.push(`[사진${missing.join('], [사진')}] 마커 누락 — 모든 사진에 마커가 있어야 함`);
      }
    }
  }

  // 기본 정보 박스 존재 여부 (📍가 없으면 기본 정보 박스 누락)
  if (!(parsed.body || '').includes('📍')) {
    violations.push('기본 정보 박스(📍⏰🚗📶) 누락 — 목차 아래에 반드시 포함');
  }

  // 이모지 수 검증 (기본 박스 📍⏰🚗📶 + 목차 🌲 + 별점 ⭐ 제외 후 3개 초과 여부)
  const allEmoji = (parsed.body || '').match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) || [];
  const fixedEmoji = (parsed.body || '').match(/[📍⏰🚗📶🌲⭐]/gu) || [];
  const freeEmoji = allEmoji.length - fixedEmoji.length;
  if (freeEmoji > 3) {
    violations.push(`본문 이모지 ${freeEmoji}개 — 기본 정보 박스·목차·별점 제외 최대 3개`);
  }

  return violations;
}

function imagePart(file) {
  const data = fs.readFileSync(file.path).toString('base64');
  return { inlineData: { data, mimeType: file.mimetype || 'image/jpeg' } };
}

function cleanupFiles(files) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  for (const f of list) {
    try { fs.unlinkSync(f.path); } catch {}
  }
}

async function fetchNaverBlogTitles(query) {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret || !query?.trim()) return [];
  try {
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(query.trim())}&display=20&sort=sim`;
    const resp = await fetch(url, {
      headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items || []).map(item => item.title.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function withTimeout(fn, ms) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout_${ms}`)), ms)),
  ]);
}

function isRetryable(err) {
  const msg = err?.message || String(err);
  return msg.includes('503')
    || msg.toLowerCase().includes('high demand')
    || msg.toLowerCase().includes('overloaded')
    || msg.toLowerCase().includes('service unavailable');
}

async function withRetry(fn, maxRetries = 5, baseDelayMs = 3000, onRetry) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), 30000);
      console.log(`[retry] ${attempt + 1}/${maxRetries} — ${delay}ms 후 재시도`);
      if (onRetry) onRetry(attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function withFallback(primaryFn, fallbackFn) {
  try {
    return await primaryFn();
  } catch (err) {
    if (isRetryable(err) && fallbackFn) {
      console.log(`[fallback] 과부하 지속 → ${FALLBACK_MODEL} 전환`);
      return await fallbackFn();
    }
    throw err;
  }
}

async function withConcurrency(tasks, concurrency, fn) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await fn(tasks[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

function friendlyGeminiError(err) {
  const msg = err?.message || String(err);
  if (msg.includes('503') || msg.toLowerCase().includes('high demand') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('service unavailable')) {
    return `지금 요청이 많아서 AI 서버가 잠시 바빠요. 잠깐 기다렸다가 다시 시도해주세요.`;
  }
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests')) {
    return `Gemini API 쿼터가 초과되었습니다. Google AI Studio에서 사용량과 결제를 확인해주세요. (현재 모델: ${GEMINI_MODEL})`;
  }
  if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
    return `모델명이 잘못되었거나 사용할 수 없는 모델입니다. .env 파일의 GEMINI_MODEL 값을 확인해주세요. (현재 모델: ${GEMINI_MODEL})`;
  }
  if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('permission')) {
    return `API 키가 유효하지 않거나 권한이 없습니다.`;
  }
  return msg.substring(0, 200);
}

// ── API 키 검증 ──
app.post('/api/verify-key', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키를 입력해주세요.' });

  try {
    const testResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1`
    );
    if (testResp.ok) return res.json({ ok: true });
    const errBody = await testResp.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || `HTTP ${testResp.status}`;
    const statusCode = [400, 401, 403].includes(testResp.status) ? 401 : 500;
    res.status(statusCode).json({ error: `API 키 오류: ${errMsg}` });
  } catch (err) {
    res.status(500).json({ error: `Google 서버에 연결할 수 없어요. (${err.message})` });
  }
});

// ── 제목 생성 ──
app.post('/api/generate-title', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  const { body, naverQuery } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: '본문 내용이 없습니다.' });

  try {
    const [naverTitles] = await Promise.all([fetchNaverBlogTitles(naverQuery)]);
    const naverBlock = naverTitles.length > 0
      ? `\n[네이버 상위 노출 제목 샘플 — 아래 제목들의 키워드 패턴을 분석해 반영하세요]\n${naverTitles.slice(0, 15).join('\n')}\n`
      : '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `아래 블로그 본문을 읽고 네이버 블로그 SEO에 최적화된 제목을 생성하세요.
${naverBlock}
[제목 작성 규칙]
1. 네이버 상위 노출 제목 샘플이 있다면, 자주 등장하는 키워드 조합 패턴을 최우선으로 반영한다.
2. 본문 내용과 반드시 일치하는 키워드만 사용한다.
3. 키워드를 나열하지 말고 자연스러운 한 문장으로 구성한다.
4. 하나의 제목 안에서 여러 롱테일 키워드가 검색될 수 있도록 설계한다.
5. 공백 포함 40자 이상으로 작성한다. 단, 60자를 넘지 않도록 한다. 중복 단어·이모티콘·의미 없는 수식어·감성 표현은 최소화한다.
6. 사람이 자연스럽게 이해할 수 있으면서도 검색 엔진이 핵심 키워드를 명확히 인식할 수 있게 작성한다.

[본문]
${body.substring(0, 3000)}

제목만 출력하세요. 다른 설명 없이 제목 텍스트만.`;
    const result = await withFallback(
      () => withRetry(() => model.generateContent(prompt)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        return withRetry(() => fb.generateContent(prompt), 3, 2000);
      }
    );
    res.json({ title: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  }
});

// ── 정보성 블로그 생성 ──
let INFO_BLOG_GUIDE = '';
try {
  INFO_BLOG_GUIDE = fs.readFileSync(path.join(__dirname, 'info-blog-guide.md'), 'utf-8').trim();
} catch {
  // 파일 없으면 무시
}

app.post('/api/generate-info-blog', upload.array('refImages', 10), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });

  const { mainKeyword, subKeywords, targetReader, searchTopics, actualInfo, affiliateLink, refLinks } = req.body;
  const refImages = req.files || [];

  if (!mainKeyword?.trim()) return res.status(400).json({ error: '핵심 키워드를 입력해주세요.' });
  if (!actualInfo?.trim()) return res.status(400).json({ error: '실제 정보를 입력해주세요.' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // 참고 자료 처리
    let refSection = '';
    const refParts = [];
    if (refLinks?.trim()) {
      refParts.push(`[참고 링크]\n${refLinks.trim()}`);
    }
    if (refImages.length > 0) {
      const refModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const analyses = await Promise.all(refImages.map(async (img, i) => {
        try {
          const result = await withRetry(() => withTimeout(() => refModel.generateContent([
            imagePart(img),
            '이 이미지에서 블로그 글 작성에 참고할 수 있는 정보, 수치, 사실을 추출하세요. 핵심 정보만 2~3문장으로 요약하세요.',
          ]), 30000));
          return `참고 이미지 ${i + 1}: ${result.response.text().trim()}`;
        } catch { return null; }
      }));
      const valid = analyses.filter(Boolean);
      if (valid.length > 0) refParts.push(`[참고 이미지 분석]\n${valid.join('\n\n')}`);
      cleanupFiles(refImages);
    }
    if (refParts.length > 0) {
      refSection = `\n[참고 자료 — 아래 내용을 활용해 글의 정확성과 정보량을 높이세요]\n${refParts.join('\n\n')}\n`;
    }

    // 검색 항목이 있으면 Google Search grounding으로 최신 정보 조회
    let searchedInfoSection = '';
    if (searchTopics?.trim()) {
      try {
        const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        const searchModel = genAI.getGenerativeModel({
          model: GEMINI_MODEL,
          tools: [{ googleSearch: {} }],
        });
        const searchPrompt = `오늘 날짜: ${today}
주제 맥락: ${mainKeyword.trim()}

아래 항목들에 대해 오늘 날짜 기준 최신·정확한 정보를 조사해주세요.

조사 항목:
${searchTopics.trim()}

각 항목별로 사실 위주로 간결하게 정리하세요. 불확실한 정보는 포함하지 마세요.`;
        const searchResult = await withRetry(() => withTimeout(() => searchModel.generateContent(searchPrompt), 30000));
        const fetched = searchResult.response.text().trim();
        if (fetched) {
          searchedInfoSection = `\n[검색된 최신 정보 — 아래 내용을 글에 정확하게 반영하세요]\n${fetched}\n`;
        }
      } catch (err) {
        console.error('[search] Google Search 실패:', err.message);
      }
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: INFO_BLOG_GUIDE });

    const prompt = `[입력값]
- 핵심 키워드: ${mainKeyword.trim()}
- 보조 키워드: ${subKeywords?.trim() || '없음'}
- 타겟 독자: ${targetReader?.trim() || '일반 독자'}
- 실제 정보 (경험/사진 내용): ${actualInfo.trim()}
- 삽입할 제휴 링크: ${affiliateLink?.trim() || '없음'}
${refSection}${searchedInfoSection}`;

    const result = await withFallback(
      () => withRetry(() => withTimeout(() => model.generateContent(prompt), 50000)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: INFO_BLOG_GUIDE });
        return withRetry(() => withTimeout(() => fb.generateContent(prompt), 50000), 3, 2000);
      }
    );
    const text = result.response.text().trim();

    const extract = (tag) => {
      const m = text.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`));
      return m ? m[1].trim() : '';
    };

    const linkSuggestion = extract('LINK_SUGGESTION');
    res.json({
      title: extract('TITLE'),
      body: extract('BODY'),
      hashtags: extract('HASHTAGS'),
      ...(linkSuggestion && { linkSuggestion }),
    });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  } finally {
    cleanupFiles(req.files);
  }
});

// ── 장소 정보 추출 ──
app.post('/api/extract-info', upload.single('photo'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  if (!req.file) return res.status(400).json({ error: '사진이 없습니다.' });

  const category = req.body.category || 'cafe';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const fields = getExtractionFields(category);
    const prompt = `이 이미지에서 ${getCategoryName(category)} 장소 정보를 추출하세요.\n아래 JSON 형식으로만 반환하세요:\n${fields}\n\n찾을 수 없는 항목은 "" (빈 문자열)로 표시하세요.`;
    const content = [imagePart(req.file), prompt];
    const result = await withFallback(
      () => withRetry(() => model.generateContent(content)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, generationConfig: { responseMimeType: 'application/json' } });
        return withRetry(() => fb.generateContent(content), 3, 2000);
      }
    );

    const rawText = result.response.text().trim();
    console.log('[extract-info] raw:', rawText.substring(0, 300));
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSON 추출 실패. 응답: ${rawText.substring(0, 200)}`);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[extract-info] error:', err.message);
    res.status(500).json({ error: friendlyGeminiError(err) });
  } finally {
    cleanupFiles(req.file);
  }
});

// ── 블로그 글 생성 ──
app.post('/api/generate', upload.array('photos'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const { category, rating, memo, sectionNames: rawSectionNames, sectionCounts: rawSectionCounts, ...info } = req.body;
    const openaiKey = req.headers['x-openai-key'] || '';
    const photos = req.files || [];
    const categoryName = getCategoryName(category);

    // 섹션별 사진 그룹 재구성
    const sectionNames = JSON.parse(rawSectionNames || '[]');
    const sectionCounts = JSON.parse(rawSectionCounts || '[]');
    const sectionGroups = [];
    let photoOffset = 0;
    sectionNames.forEach((name, i) => {
      const count = sectionCounts[i] || 0;
      sectionGroups.push({ name, photos: photos.slice(photoOffset, photoOffset + count) });
      photoOffset += count;
    });
    if (sectionGroups.length === 0) sectionGroups.push({ name: '전체', photos });

    const genAI = new GoogleGenerativeAI(apiKey);
    const descModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
    const blogModel = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: STYLE_GUIDE });

    send({ type: 'status', message: `사진 ${photos.length}장 분석 중...` });

    // 네이버 블로그 제목 검색 (사진 분석과 병렬 실행)
    const naverQuery = [info.name, categoryName].filter(Boolean).join(' ');
    const naverTitlesPromise = fetchNaverBlogTitles(naverQuery);

    // 사진 설명 — 병렬 처리
    const allPhotoTasks = [];
    let globalIdx = 1;
    for (const group of sectionGroups) {
      for (const photo of group.photos) {
        allPhotoTasks.push({ photo, group, index: globalIdx });
        globalIdx++;
      }
    }

    const photoPrompt = (sectionName) => `이 사진에서 블로그 리뷰에 쓸 내용을 추출하세요.
장르: ${categoryName} 리뷰 / 목차: ${sectionName}
- 사진에 보이는 것을 구체적으로 파악하세요 (메뉴명, 색감, 구조, 특징 등)
- 사진에 실제로 보이는 내용만 묘사할 것. 사진에 없는 정보는 절대 언급하지 마세요
- 목차 이름은 분류 기준일 뿐, 억지로 모든 항목을 언급할 필요 없음
- 메뉴판·가격표가 보이면 메뉴명과 가격을 최대한 정확히 읽어서 포함하세요
- 단순 묘사가 아닌 방문자가 느낄 실용적 팁·장단점으로 확장하세요
- 2~3문장, 설명만 작성하세요`;

    const gptClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    let completed = 0;
    const photoDescriptions = await withConcurrency(allPhotoTasks, 6, async ({ photo, group, index }) => {
      console.log(`[photo ${index}/${allPhotoTasks.length}] 분석 시작 — 목차: ${group.name} / 파일크기: ${Math.round(photo.size/1024)}KB`);
      try {
        let desc;
        if (gptClient) {
          const base64 = fs.readFileSync(photo.path).toString('base64');
          const gptResp = await withTimeout(() => gptClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: `data:${photo.mimetype || 'image/jpeg'};base64,${base64}`, detail: 'auto' } },
              { type: 'text', text: photoPrompt(group.name) },
            ]}],
            max_tokens: 300,
          }), 30000);
          desc = gptResp.choices[0].message.content.trim();
        } else {
          const result = await withRetry(() => withTimeout(() => descModel.generateContent([
            imagePart(photo),
            photoPrompt(group.name),
          ]), 30000));
          desc = result.response.text().trim();
        }
        completed++;
        console.log(`[photo ${index}/${allPhotoTasks.length}] 완료 (${completed}번째)`);
        send({ type: 'progress', current: completed, total: allPhotoTasks.length });
        return { index, section: group.name, desc };
      } catch (err) {
        completed++;
        console.error(`[photo ${index}/${allPhotoTasks.length}] 실패 — ${err.message}`);
        send({ type: 'progress', current: completed, total: allPhotoTasks.length });
        return { index, section: group.name, desc: `${index}번째 사진` };
      }
    });

    send({ type: 'status', message: '블로그 글 작성 중...' });

    const ratingNum = parseFloat(rating) || 4.5;
    const fieldInfo = buildCategoryInfoText(category, info);

    const photoBlockBySection = sectionGroups.map(group => {
      const groupPhotos = photoDescriptions.filter(p => p.section === group.name);
      if (groupPhotos.length === 0) return null;
      return `[${group.name}]\n${groupPhotos.map(p => `[사진${p.index}] ${p.desc}`).join('\n\n')}`;
    }).filter(Boolean).join('\n\n---\n\n');

    const memoBlock = memo ? `\n[사용자 지정 정보 — 반드시 포함, 반드시 분산 배치]\n${memo}\n\n★★ 배치 원칙 (총평 몰아넣기 절대 금지) ★★\n위 정보 항목 하나하나를 아래 순서로 처리하세요:\n1. 이 정보가 어느 사진 섹션의 내용과 가장 잘 어울리는가? → 해당 섹션 본문에 자연스럽게 녹여 쓰세요.\n2. 모든 섹션을 검토한 뒤에도 어울리는 섹션이 전혀 없는 항목만, 최후 수단으로 총평에 허용합니다.\n3. 총평은 방문 전체 소감 1~3문장만. 사용자 정보를 총평에 나열하는 것은 절대 금지.\n` : '';

    const affiliateLink = category === 'accommodation' ? (info.affiliateLink?.trim() || '') : '';
    const affiliateLinkBlock = affiliateLink
      ? `\n[삽입할 예약/제휴 링크: ${affiliateLink}]\n위 링크를 글 안에 1회만, 독자가 "나도 예약하고 싶다"는 마음이 차오른 직후 — 객실·부대시설 후기 섹션 이후의 자연스러운 위치에 삽입하세요. 링크 위치는 [링크: ${affiliateLink}] 마커로 표시. 광고체 금지, 1인칭 경험담에 자연스럽게 녹일 것.\n`
      : '';

    const photoOrderNote = photos.length > 0
      ? `\n[사진 순서 절대 준수]\n사진 마커는 [사진1]부터 [사진${photos.length}]까지 반드시 이 순서대로만 삽입하세요. 내용에 따라 순서를 바꾸는 것은 금지입니다.\n`
      : '';

    const sectionListBlock = sectionNames.length > 0
      ? `\n[목차 구성 — 아래 이름을 본문 목차와 각 섹션 제목으로 반드시 그대로 사용하세요]\n${sectionNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n`
      : '';

    const samplesSection = STYLE_SAMPLES
      ? `[실제 블로그 샘플 — 아래 글들의 말투·어미·문장부호를 그대로 모방해서 써야 합니다]
특히 다음 표현을 반드시 사용하세요:
- "요렇게", "요런", "요기" 같은 구어체 지시어
- "ㅎㅎ", "ㅋㅋ", "ㅠㅠ", "ㅎㅅㅎ" 같은 자음 감정 표현 (문장 끝에 자연스럽게)
- "~합니당", "~했어용", "~조음" 같은 부드러운 구어체 어미 (20~30% 비율로)
- 마침표(.)는 거의 쓰지 않고 "~!", "~", "..." 로 대체
- 짧고 툭툭 끊기는 문장 흐름

${STYLE_SAMPLES}

---
위 샘플의 문체와 말투를 그대로 유지하면서, 아래 정보로 블로그 글을 작성하세요.`
      : '';

    const naverTitles = await naverTitlesPromise;
    const naverBlock = naverTitles.length > 0
      ? `[네이버 상위 노출 제목 샘플 — [TITLE] 작성 시 이 제목들의 키워드 패턴을 분석해 반영하세요]\n${naverTitles.slice(0, 15).join('\n')}\n`
      : '';

    const prompt = `${samplesSection}

${fieldInfo}

별점: ${ratingNum}점 / 5점
${memoBlock}${affiliateLinkBlock}${sectionListBlock}${naverBlock}
[사진 분석 결과 — 총 ${photos.length}장, 목차별 분류 / 각 목차의 사진을 해당 섹션 본문에 순서대로 배치]
${photoBlockBySection}
${photoOrderNote}
`;

    const blogResult = await withFallback(
      () => withRetry(
        () => withTimeout(() => blogModel.generateContent(prompt), 50000),
        3, 3000,
        (attempt) => send({ type: 'status', message: `AI 서버가 바빠서 재시도 중... (${attempt}/3)` })
      ),
      () => {
        send({ type: 'status', message: 'AI 서버 과부하 — 대체 모델로 전환 중...' });
        const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: STYLE_GUIDE });
        return withRetry(
          () => withTimeout(() => fbModel.generateContent(prompt), 50000),
          2, 2000,
          (attempt) => send({ type: 'status', message: `대체 모델 재시도 중... (${attempt}/2)` })
        );
      }
    );
    let parsed = parseBlogResponse(blogResult.response.text());

    const violations = validateBlogOutput(parsed, photos.length);
    if (violations.length > 0) {
      console.log('[validate] 위반 감지:', violations);
      send({ type: 'status', message: '규칙 검수 중 — 자동 수정...' });
      const retryPrompt = `[규칙 위반 수정]\n다음 항목이 지켜지지 않았습니다:\n${violations.map((v) => `- ${v}`).join('\n')}\n\n위 항목만 고쳐서 전체 글을 다시 동일한 [TITLE][BODY][HASHTAGS] 형식으로 출력하세요.\n\n---\n\n${prompt}`;
      const retryResult = await withFallback(
        () => withRetry(() => withTimeout(() => blogModel.generateContent(retryPrompt), 50000), 2, 3000),
        () => {
          const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: STYLE_GUIDE });
          return withRetry(() => withTimeout(() => fbModel.generateContent(retryPrompt), 50000), 2, 2000);
        }
      );
      parsed = parseBlogResponse(retryResult.response.text());
    }

    send({ type: 'complete', result: parsed });
    res.end();
  } catch (err) {
    console.error('generate error:', err);
    send({ type: 'error', message: friendlyGeminiError(err) });
    res.end();
  } finally {
    cleanupFiles(req.files);
  }
});

// ── 이미지 생성 ──
const VIEWPOINT_PROMPTS = {
  'first-person':  'Shot from the photographer\'s own first-person perspective, as if personally holding the smartphone and looking directly at the scene. The photographer does not appear in the frame.',
  'across':        'Shot from the perspective of the person sitting or standing across from the photographer, facing toward them. The photographer does not appear in the frame.',
  'third-party':   'Shot by a third person observing from the side or slightly behind the scene. The photographer does not appear in the frame.',
  'selfie':        'Shot as a selfie using a front-facing smartphone camera. The photographer\'s face and arm holding the phone are visible in the frame.',
  'trailing':      'Shot from directly behind the subject, following from a trailing perspective as they walk or move forward. The photographer does not appear in the frame.',
  'over-shoulder': 'Shot over someone\'s shoulder in the foreground, looking past them toward the subject or scene ahead. The photographer does not appear in the frame.',
  'top-down':      'Shot from directly above, looking straight down at the subject in a flat-lay or bird\'s-eye perspective. The photographer does not appear in the frame.',
};

const POSITION_PROMPTS = {
  'seated-table':  'The photographer is seated at the table.',
  'across-seat':   'The photographer is seated at the opposite seat directly across the table.',
  'walking':       'The photographer is walking while taking the shot, giving a slight in-motion feel.',
  'standing':      'The photographer is standing upright while taking the shot.',
  'window-seat':   'The photographer is seated at a window seat with natural light coming in from the side.',
  'across-street': 'The photographer is standing across the street from the subject.',
  'in-vehicle':    'The photographer is inside a vehicle, shooting through the window.',
};

const STYLE_PROMPTS = {
  'food-closeup': 'The composition is a tight close-up shot focused entirely on the food, filling most of the frame with rich detail.',
  'full-table':   'The composition captures the entire table setting in a wide shot, showing all items on the table.',
  'landscape':    'The composition is landscape-focused with the scenery or environment as the dominant subject.',
  'portrait':     'The composition is portrait-oriented with a person as the main subject, background naturally blurred.',
  'candid':       'The composition is a casual, candid snapshot with a natural unposed feel — as if the moment was caught spontaneously.',
  'wide':         'The composition is a wide-angle shot capturing a broad environmental view of the space.',
  'detail':       'The composition emphasizes fine details and textures in a close macro-style shot.',
};

function buildImagePrompt({ location, situation, subject, viewpoint, shootingPosition, photoStyle, timeWeather, details }) {
  const sit = situation?.trim() || '';
  const tw  = timeWeather?.trim() || 'natural daylight';
  const det = details?.trim() || '';

  const viewpointPrompt  = VIEWPOINT_PROMPTS[viewpoint] || VIEWPOINT_PROMPTS['first-person'];
  const positionPrompt   = POSITION_PROMPTS[shootingPosition] || (shootingPosition ? `The photographer is ${shootingPosition}.` : '');
  const stylePrompt      = STYLE_PROMPTS[photoStyle] || '';
  const noPhotographer   = viewpoint !== 'selfie' ? 'The photographer must not appear anywhere in the image.' : '';
  const situationClause  = sit ? `during ${sit}` : '';

  return [
    `A candid, realistic smartphone photo taken at ${location}${situationClause ? ` ${situationClause}` : ''}.`,
    `Main subject: ${subject}.`,
    viewpointPrompt,
    positionPrompt,
    stylePrompt,
    `Lighting and time: ${tw}.`,
    det ? `Additional details: ${det}.` : '',
    'Shot with an iPhone default camera by a regular person. No heavy post-processing, no filters, no studio lighting.',
    'Realistic smartphone HDR, natural color grading, authentic spontaneous framing, no commercial or advertising photography feel.',
    'Not a 3D render, not an AI illustration, not an overly perfect or staged composition.',
    noPhotographer,
  ].filter(Boolean).join(' ');
}

const VALID_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536']);

app.post('/api/generate-image', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'OpenAI API 키가 필요합니다.' });

  const { location, situation, subject, viewpoint, shootingPosition, photoStyle, timeWeather, details, size = '1024x1024', rawPrompt } = req.body;
  const safeSize = VALID_SIZES.has(size) ? size : '1024x1024';

  let prompt;
  if (rawPrompt?.trim()) {
    prompt = rawPrompt.trim();
  } else {
    if (!location?.trim()) return res.status(400).json({ error: '장소를 입력해주세요.' });
    if (!subject?.trim())  return res.status(400).json({ error: '피사체를 입력해주세요.' });
    prompt = buildImagePrompt({ location: location.trim(), situation, subject: subject.trim(), viewpoint, shootingPosition, photoStyle, timeWeather, details });
  }
  console.log(`[generate-image] size=${safeSize} prompt=${prompt.substring(0, 80)}...`);

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      quality: 'medium',
      size: safeSize,
      n: 1,
    });
    const b64 = response.data[0].b64_json;
    res.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('[generate-image] error:', err.message);
    const msg = err?.message || String(err);
    const status = err?.status;
    let friendlyMsg;
    if (status === 401 || status === 403) friendlyMsg = 'OpenAI API 키가 유효하지 않아요.';
    else if (status === 429) friendlyMsg = 'OpenAI API 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.';
    else friendlyMsg = msg.substring(0, 200);
    res.status(500).json({ error: friendlyMsg });
  }
});

// ── 이미지 편집 / 합성 ──
app.post('/api/edit-image', upload.single('image'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'OpenAI API 키가 필요합니다.' });
  if (!req.file) return res.status(400).json({ error: '이미지를 업로드해주세요.' });

  const { prompt, size = '1024x1024' } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: '프롬프트를 입력해주세요.' });

  const safeSize = VALID_SIZES.has(size) ? size : '1024x1024';
  console.log(`[edit-image] size=${safeSize} prompt=${prompt.substring(0, 80)}...`);

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: fs.createReadStream(req.file.path),
      prompt: prompt.trim(),
      size: safeSize,
      n: 1,
    });
    const b64 = response.data[0].b64_json;
    res.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('[edit-image] error:', err.message);
    const msg = err?.message || String(err);
    const status = err?.status;
    let friendlyMsg;
    if (status === 401 || status === 403) friendlyMsg = 'OpenAI API 키가 유효하지 않아요.';
    else if (status === 429) friendlyMsg = 'OpenAI API 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.';
    else friendlyMsg = msg.substring(0, 300);
    res.status(500).json({ error: friendlyMsg });
  } finally {
    cleanupFiles(req.file);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = parseInt(process.env.PORT || '4000');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n찍기만 해! 서버: http://localhost:${PORT}\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n포트 ${PORT}가 이미 사용 중입니다. PORT=4001 node server.js 로 시도해보세요.\n`);
  } else {
    throw err;
  }
  process.exit(1);
});
