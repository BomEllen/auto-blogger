const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_MODEL, FALLBACK_MODEL, withTimeout, withRetry, withFallback, friendlyGeminiError } = require('../lib/ai');
const { upload, imagePart, cleanupFiles } = require('../lib/upload');
const { sanitizeFormattingHtml, parseTitles } = require('../lib/text');

const router = express.Router();

function validateInfoBlogOutput(body, affiliateLinks, contentType, verifiedPrices) {
  const violations = [];

  // 사진 마커 수
  const photoMarkers = (body.match(/\[사진 \d+/g) || []).length;
  if (photoMarkers < 8) violations.push(`사진 마커 ${photoMarkers}개 — 최소 8개 필요`);

  // 비교형: 표 마커 2개 이상
  if (['비교형', '구매형', '제품형'].includes(contentType)) {
    const tableMarkers = (body.match(/\[표 삽입/g) || []).length;
    if (tableMarkers < 2) violations.push(`표 마커 ${tableMarkers}개 — ${contentType}에는 기본정보표+비교표 최소 2개 필요`);

    // 비교표 마지막 행이 링크 행인지
    const compTableMatch = body.match(/\[표 삽입[^\]]*비교표[^\]]*\]([\s\S]*?)(?=\n\n\S|\[표 삽입|$)/);
    if (compTableMatch) {
      const tableBody = compTableMatch[1];
      const rows = tableBody.split('\n').map(r => r.trim()).filter(Boolean);
      const lastRow = rows[rows.length - 1] || '';
      if (!lastRow.includes('[링크:')) {
        violations.push('비교표 마지막 행이 링크 행이 아님');
      } else {
        // 링크 앵커 텍스트가 열마다 동일한지
        const anchors = [...lastRow.matchAll(/\[링크:[^\]]*\/\s*([^\]]+?)\s*\]/g)].map(m => m[1].trim());
        const uniqueAnchors = new Set(anchors);
        if (anchors.length > 1 && uniqueAnchors.size === 1) {
          violations.push(`비교표 링크 앵커 텍스트가 모두 동일함: "${anchors[0]}"`);
        }
      }
    }

    // 가격 셀에 숫자가 있는데 verifiedPrices 미입력 — 환각 탐지
    if (!verifiedPrices?.trim()) {
      const priceRowMatch = body.match(/가격\s*\/[^\n]*/);
      if (priceRowMatch && /\d{3,}/.test(priceRowMatch[0])) {
        violations.push('비교표 가격 셀에 숫자가 있으나 [확인된 가격·별점] 입력이 없음 — 가격 환각 의심');
      }
    }
  }

  // 동일 도메인(사이트명) 5회 초과
  const linkMatches = [...body.matchAll(/\[링크:\s*([^/\]]+)/g)].map(m => m[1].trim());
  const domainCount = {};
  for (const d of linkMatches) { domainCount[d] = (domainCount[d] || 0) + 1; }
  for (const [d, cnt] of Object.entries(domainCount)) {
    if (cnt > 5) violations.push(`동일 사이트 "${d}" ${cnt}회 — 5회 초과 금지`);
  }

  // 금지 표현
  const forbidden = ['최저가 보장', '무조건', '강추', '지금 안 사면 손해', '후회 없음', '필수템'];
  forbidden.forEach(f => { if (body.includes(f)) violations.push(`금지 표현 "${f}" 사용됨`); });

  if (violations.length > 0) {
    console.warn('[info-blog validate] 위반 항목:', violations);
  }
  return violations;
}

let INFO_BLOG_GUIDE = '';
try {
  INFO_BLOG_GUIDE = fs.readFileSync(path.join(__dirname, '../prompts/info-blog-guide.md'), 'utf-8').trim();
} catch {
  // 파일 없으면 무시
}

router.post('/generate-info-blog', upload.array('refImages', 10), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });

  const { mainKeyword, subKeywords, readerProfile, searchTopics, actualInfo, emphasizeContent, customDirectives, contentType, comparisonDesign, refLinks, verifiedPrices } = req.body;
  const affiliateLinks = (() => { try { return JSON.parse(req.body.affiliateLinks || '[]'); } catch { return []; } })();
  const refImages = req.files || [];

  if (!mainKeyword?.trim()) return res.status(400).json({ error: '핵심 키워드를 입력해주세요.' });

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

    const emphasizeBlock = emphasizeContent?.trim()
      ? `\n[특별 강조 요청 — 아래 내용은 글에서 다른 부분보다 강조 서식(배경색·글씨색·볼드)을 집중적으로 적용해 부각시킬 것]\n${emphasizeContent.trim()}\n`
      : '';

    const directivesBlock = customDirectives?.trim()
      ? `\n[사용자 지정 AI 작성 지침 — 아래 규칙을 반드시 따를 것]\n${customDirectives.trim()}\n`
      : '';

    const comparisonBlock = comparisonDesign?.trim()
      ? `\n[비교 구간 설계 — 아래 정보를 바탕으로 ⑤ 비교·선택 가이드 섹션을 구성할 것]\n${comparisonDesign.trim()}\n`
      : '';

    const verifiedPricesBlock = verifiedPrices?.trim()
      ? `\n[확인된 가격·별점]\n${verifiedPrices.trim()}\n위 값을 비교표의 해당 셀에 채우고, 가격 행 아래에 "(YYYY년 M월 기준)" 확인 시점을 표기한다. 입력이 없는 항목은 "(확인 후 기입)"으로 남긴다. 어떤 경우에도 가격·별점·리뷰수를 추정하거나 지어내지 않는다.\n`
      : '';

    const affiliateBlock = affiliateLinks.length > 0
      ? `\n[제휴 배치도 — 아래 링크를 지정된 위치에 삽입할 것. 앵커 텍스트는 열마다 다르게]\n${affiliateLinks.map(l => `사이트: ${l.site || '미입력'} | URL: ${l.url} | 배치: ${l.anchor || '표내부'} | 레이블: ${l.label || ''} | 이유: ${l.reason || '없음'}`).join('\n')}\n각 링크의 '이유'가 있으면 그것을 근거로 "왜 내 링크에서 사야 하는지"를 쓴다. '이유'가 없으면 장단점 비교 방식으로 대체한다. 특가·할인·쿠폰·최저가는 입력값에 없으면 절대 지어내지 않는다.\n`
      : '\n- 삽입할 제휴 링크: 없음\n';

    const readerProfileBlock = readerProfile?.trim()
      ? `[독자 관통선 — 글 전체에서 이 독자 한 명을 ①도입·④경험·⑤결론·링크 직전 4자리에서 일관되게 호출할 것]\n${readerProfile.trim()}\n\n`
      : '';

    const prompt = `${readerProfileBlock}[입력값]
- 핵심 키워드: ${mainKeyword.trim()}
- 보조 키워드: ${subKeywords?.trim() || '없음'}
- 글 유형: ${contentType?.trim() || '정보형'}
- 실제 정보 (경험/사진 내용): ${actualInfo?.trim() || '없음'}
${emphasizeBlock}${directivesBlock}${comparisonBlock}${verifiedPricesBlock}${affiliateBlock}${refSection}${searchedInfoSection}`;

    const result = await withFallback(
      () => withRetry(() => withTimeout(() => model.generateContent(prompt), 50000)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: INFO_BLOG_GUIDE });
        return withRetry(() => withTimeout(() => fb.generateContent(prompt), 50000), 3, 2000);
      }
    );
    const extractFrom = (src, tag) => {
      const m = src.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`));
      return m ? m[1].trim() : '';
    };

    let text = result.response.text().trim();
    let title = extractFrom(text, 'TITLE');
    let body = extractFrom(text, 'BODY');
    let linkSuggestion = extractFrom(text, 'LINK_SUGGESTION');

    if (!body) {
      console.warn('[info-blog] [BODY] 태그 누락, 재시도...');
      const retryPrompt = `[출력 형식 오류]\n이전 응답에서 [BODY]...[/BODY] 태그가 누락됐습니다.\n반드시 아래 형식을 지켜 전체 글을 다시 출력하세요.\n[TITLE]제목[/TITLE]\n[BODY]본문 전체 + 마지막 줄 해시태그 20개[/BODY]\n\n---\n\n${prompt}`;
      const retryResult = await withFallback(
        () => withRetry(() => withTimeout(() => model.generateContent(retryPrompt), 60000)),
        () => {
          const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: INFO_BLOG_GUIDE });
          return withRetry(() => withTimeout(() => fb.generateContent(retryPrompt), 60000), 2, 2000);
        }
      );
      const retryText = retryResult.response.text().trim();
      title = extractFrom(retryText, 'TITLE') || title;
      body = extractFrom(retryText, 'BODY');
      linkSuggestion = extractFrom(retryText, 'LINK_SUGGESTION') || linkSuggestion;
    }

    if (!body) {
      return res.status(500).json({ error: '글 생성에 실패했어요. 다시 시도해주세요.' });
    }

    // 후처리 검증
    const infoViolations = validateInfoBlogOutput(body, affiliateLinks, contentType?.trim() || '정보형', verifiedPrices);
    if (infoViolations.length > 0) {
      console.warn('[info-blog] 검증 위반:', infoViolations);
      const retryPrompt2 = `[규칙 위반 수정]\n다음 항목이 지켜지지 않았습니다:\n${infoViolations.map(v => `- ${v}`).join('\n')}\n\n위 항목만 고쳐서 전체 글을 다시 동일한 [TITLE][BODY] 형식으로 출력하세요.\n\n---\n\n${prompt}`;
      const retryResult2 = await withFallback(
        () => withRetry(() => withTimeout(() => model.generateContent(retryPrompt2), 60000)),
        () => {
          const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: INFO_BLOG_GUIDE });
          return withRetry(() => withTimeout(() => fb.generateContent(retryPrompt2), 60000), 2, 2000);
        }
      );
      const retryText2 = retryResult2.response.text().trim();
      title = extractFrom(retryText2, 'TITLE') || title;
      body = extractFrom(retryText2, 'BODY') || body;
      linkSuggestion = extractFrom(retryText2, 'LINK_SUGGESTION') || linkSuggestion;
    }

    body = sanitizeFormattingHtml(body);

    const titles = parseTitles(title);
    res.json({
      title: titles[0] || title,
      titles,
      body,
      ...(linkSuggestion && { linkSuggestion }),
    });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  } finally {
    cleanupFiles(req.files);
  }
});

module.exports = router;
