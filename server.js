require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
  storage: multer.memoryStorage(),
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
  return { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype || 'image/jpeg' } };
}

function isRetryable(err) {
  const msg = err?.message || String(err);
  return msg.includes('503')
    || msg.toLowerCase().includes('high demand')
    || msg.toLowerCase().includes('overloaded')
    || msg.toLowerCase().includes('service unavailable');
}

async function withRetry(fn, maxRetries = 3, baseDelayMs = 2000, onRetry) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`[retry] ${attempt + 1}/${maxRetries} — ${delay}ms 후 재시도`);
      if (onRetry) onRetry(attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
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
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: '본문 내용이 없습니다.' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `아래 블로그 본문을 읽고 네이버 블로그 SEO에 최적화된 제목을 생성하세요.

[제목 작성 규칙]
1. 본문 내용과 관련된 핵심 키워드, 연관 키워드, 브랜드 키워드를 먼저 추출한다.
2. 검색량이 있는 키워드를 우선 사용하되 본문 내용과 반드시 일치해야 한다.
3. 키워드를 나열하지 말고 자연스러운 한 문장으로 구성한다.
4. 하나의 제목 안에서 여러 롱테일 키워드가 검색될 수 있도록 설계한다.
5. 공백 포함 40자 이내, 중복 단어·이모티콘·의미 없는 수식어·감성 표현은 최소화한다.
6. 사람이 자연스럽게 이해할 수 있으면서도 검색 엔진이 핵심 키워드를 명확히 인식할 수 있게 작성한다.

[본문]
${body.substring(0, 3000)}

제목만 출력하세요. 다른 설명 없이 제목 텍스트만.`;
    const result = await withRetry(() => model.generateContent(prompt));
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
          const result = await withRetry(() => refModel.generateContent([
            imagePart(img),
            '이 이미지에서 블로그 글 작성에 참고할 수 있는 정보, 수치, 사실을 추출하세요. 핵심 정보만 2~3문장으로 요약하세요.',
          ]));
          return `참고 이미지 ${i + 1}: ${result.response.text().trim()}`;
        } catch { return null; }
      }));
      const valid = analyses.filter(Boolean);
      if (valid.length > 0) refParts.push(`[참고 이미지 분석]\n${valid.join('\n\n')}`);
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
        const searchResult = await withRetry(() => searchModel.generateContent(searchPrompt));
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

    const result = await withRetry(() => model.generateContent(prompt));
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
    const result = await withRetry(() => model.generateContent([imagePart(req.file), prompt]));

    const rawText = result.response.text().trim();
    console.log('[extract-info] raw:', rawText.substring(0, 300));
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSON 추출 실패. 응답: ${rawText.substring(0, 200)}`);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[extract-info] error:', err.message);
    res.status(500).json({ error: friendlyGeminiError(err) });
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
    const descModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const blogModel = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: STYLE_GUIDE });

    send({ type: 'status', message: `사진 ${photos.length}장 분석 중...` });

    // 사진 설명 — 한 장씩 순차 처리 (메모리 효율)
    const photoDescriptions = [];
    let globalIdx = 1;
    for (const group of sectionGroups) {
      for (const photo of group.photos) {
        send({ type: 'progress', current: globalIdx, total: photos.length });
        try {
          const result = await withRetry(() => descModel.generateContent([
            imagePart(photo),
            `이 사진에서 블로그 리뷰에 쓸 내용을 추출하세요.
장르: ${categoryName} 리뷰 / 목차: ${group.name}
- 사진에 보이는 것을 구체적으로 파악하세요 (메뉴명, 색감, 구조, 특징 등)
- 단순 묘사가 아닌 방문자가 느낄 실용적 팁·장단점으로 확장하세요
- 2~3문장, 설명만 작성하세요`,
          ]));
          photoDescriptions.push({ index: globalIdx, section: group.name, desc: result.response.text().trim() });
        } catch {
          photoDescriptions.push({ index: globalIdx, section: group.name, desc: `${globalIdx}번째 사진` });
        }
        globalIdx++;
      }
    }

    send({ type: 'status', message: '블로그 글 작성 중...' });

    const ratingNum = parseFloat(rating) || 4.5;
    const fieldInfo = buildCategoryInfoText(category, info);

    const photoBlockBySection = sectionGroups.map(group => {
      const groupPhotos = photoDescriptions.filter(p => p.section === group.name);
      if (groupPhotos.length === 0) return null;
      return `[${group.name}]\n${groupPhotos.map(p => `[사진${p.index}] ${p.desc}`).join('\n\n')}`;
    }).filter(Boolean).join('\n\n---\n\n');

    const memoBlock = memo ? `\n[반드시 포함할 내용 - 사용자가 직접 지정]\n${memo}\n` : '';

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

    const prompt = `${samplesSection}

${fieldInfo}

별점: ${ratingNum}점 / 5점
${memoBlock}${affiliateLinkBlock}${sectionListBlock}
[사진 분석 결과 — 총 ${photos.length}장, 목차별 분류 / 각 목차의 사진을 해당 섹션 본문에 순서대로 배치]
${photoBlockBySection}
${photoOrderNote}
`;

    const blogResult = await withRetry(
      () => blogModel.generateContent(prompt),
      3, 2000,
      (attempt) => send({ type: 'status', message: `AI 서버가 바빠서 재시도 중... (${attempt}/3)` })
    );
    let parsed = parseBlogResponse(blogResult.response.text());

    const violations = validateBlogOutput(parsed, photos.length);
    if (violations.length > 0) {
      console.log('[validate] 위반 감지:', violations);
      send({ type: 'status', message: '규칙 검수 중 — 자동 수정...' });
      const retryPrompt = `[규칙 위반 수정]\n다음 항목이 지켜지지 않았습니다:\n${violations.map((v) => `- ${v}`).join('\n')}\n\n위 항목만 고쳐서 전체 글을 다시 동일한 [TITLE][BODY][HASHTAGS] 형식으로 출력하세요.\n\n---\n\n${prompt}`;
      const retryResult = await withRetry(() => blogModel.generateContent(retryPrompt));
      parsed = parseBlogResponse(retryResult.response.text());
    }

    send({ type: 'complete', result: parsed });
    res.end();
  } catch (err) {
    console.error('generate error:', err);
    send({ type: 'error', message: friendlyGeminiError(err) });
    res.end();
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = parseInt(process.env.PORT || '4000');
app.listen(PORT, () => {
  console.log(`\n찍기만 해! 서버: http://localhost:${PORT}\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n포트 ${PORT}가 이미 사용 중입니다. PORT=4001 node server.js 로 시도해보세요.\n`);
  } else {
    throw err;
  }
  process.exit(1);
});
