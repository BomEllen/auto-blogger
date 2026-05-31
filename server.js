require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

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

// ═══════════════════════════════════════════════════
// ✏️  글쓰기 규칙 — 수정할 때 이 영역만 보면 됩니다
// ═══════════════════════════════════════════════════
const STYLE_GUIDE = `
당신은 한국의 인기 라이프스타일/카페 블로거 '연녹'입니다.
아래 규칙을 반드시 따라 글을 작성하세요.

[말투 & 어미]
- 해요체 기본: ~했어요, ~예요, ~더라구요, ~것 같아요, ~있었습니다, ~하더라구요
- 구어체 조사: "요렇게", "요런", "요것", "요기"를 자주 사용
- 감탄/공감: "ㅎㅎㅎ", "ㅠ", "ㅠㅠ", "ㅋㅋㅋㅋㅋ"를 문장 끝에 자연스럽게 붙임
- 단점 인정: "개인적으로는~", "아쉬웠던 점은~" 식으로 솔직하게
- 강조: 중요한 부분은 반복 ("너무너무너무 맛있었어요")
- 여운: "..." 자주 활용

[글 구성 & 형식]
1. 첫 문장은 "안녕하세요!!" 로 시작하고 내돈내산임을 밝히세요.
2. 목차를 본문 앞에 넣으세요 (🌲 이모지, 섹션 번호 포함).
3. 기본 정보 박스(📍⏰🚗📶)를 목차 아래에 넣으세요.
4. 섹션별로 나누어 글을 구성하고, 사진 설명을 본문에 자연스럽게 녹여 넣으세요.
   사진 위치에 [사진1], [사진2] 마커를 삽입하세요.
   ★ 사진 마커는 반드시 [사진1] → [사진2] → [사진3] … 순서 그대로, 건너뛰거나 순서를 바꾸지 말 것.
   사진 내용이 글 흐름과 맞지 않더라도 순서 변경은 절대 금지. 사용자가 직접 정한 순서입니다.
5. 본문 마지막에 총평을 쓰고, 마지막 줄에 입력받은 별점을 ⭐ X.X/5점 형태로 표기하세요.
6. 글 분량: 1800~2500자.

[총평 스타일]
- 실제로 다녀온 사람처럼 솔직하고 담백하게 마무리
- 재방문 의사는 솔직하게 표현하되 과장하지 않음

[절대 하지 말 것]
- 마케팅 문구 금지: "합리적인 가격", "최고의 퀄리티" 등 홍보성 문구
- 모든 걸 칭찬하는 글 금지. 단점은 솔직하게 쓸 것
- 마크다운 문법 금지 (**굵게**, ##헤더, - 목록 기호 등). 순수 텍스트로만 작성
- 기본 정보 박스 외 본문 이모지는 최대 3개
- 모든 문장 어미에 온점을 붙이지 마세요. 1/3 정도는 생략
`;
// ═══════════════════════════════════════════════════

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

function imagePart(file) {
  return { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype || 'image/jpeg' } };
}

function friendlyGeminiError(err) {
  const msg = err?.message || String(err);
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
    const result = await model.generateContent([imagePart(req.file), prompt]);

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
    const { category, rating, memo, ...info } = req.body;
    const photos = req.files || [];
    const categoryName = getCategoryName(category);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    send({ type: 'status', message: `사진 ${photos.length}장 AI 분석 중...` });

    const photoDescriptions = [];
    for (let i = 0; i < photos.length; i++) {
      send({ type: 'progress', current: i + 1, total: photos.length });
      try {
        const result = await model.generateContent([
          imagePart(photos[i]),
          `이 사진을 보고 한국 라이프스타일 블로그용 사진 설명을 2~3문장으로 작성해주세요.
장르: ${categoryName} 리뷰 블로그
말투: 해요체, 친근한 구어체
사진에 보이는 것을 구체적으로 묘사하되 감성적 표현 포함
설명만 작성하고 다른 말은 하지 마세요.`,
        ]);
        photoDescriptions.push({ index: i + 1, desc: result.response.text().trim() });
      } catch {
        photoDescriptions.push({ index: i + 1, desc: `${i + 1}번째 사진` });
      }
    }

    send({ type: 'status', message: '블로그 글 작성 중...' });

    const ratingNum = parseFloat(rating) || 4.5;
    const fieldInfo = buildCategoryInfoText(category, info);
    const photoBlock = photoDescriptions.map((p) => `[사진${p.index}] ${p.desc}`).join('\n\n');
    const photoOrderNote = photos.length > 0
      ? `\n[사진 순서 절대 준수]\n사진 마커는 [사진1]부터 [사진${photos.length}]까지 반드시 이 순서대로만 삽입하세요. 내용에 따라 순서를 바꾸는 것은 금지입니다.\n`
      : '';
    const memoBlock = memo ? `\n[반드시 포함할 내용 - 사용자가 직접 지정]\n${memo}\n` : '';

    const samplesSection = STYLE_SAMPLES
      ? `\n\n[참고할 실제 블로그 글 예시 - 아래 글들의 문체·어투·구성 방식을 그대로 따라하세요]\n\n${STYLE_SAMPLES}\n\n---`
      : '';

    const prompt = `${STYLE_GUIDE}${samplesSection}

---

아래 정보를 바탕으로 완성된 네이버 블로그 리뷰 글을 작성하세요.

${fieldInfo}

별점: ${ratingNum}점 / 5점
${memoBlock}
[업로드된 사진 AI 분석 결과 - 총 ${photos.length}장, 아래 번호 순서 그대로 본문에 배치]
${photoBlock}
${photoOrderNote}

---

별점 표기: 마지막 줄에 "⭐ ${ratingNum}/5점" 형태로.

[출력 형식 - 반드시 이 태그만 사용, 태그 외 텍스트 없음]
[TITLE]네이버 SEO 최적화 제목 (지역명+장소명+특징 키워드, 40자 이내)[/TITLE]
[BODY]
본문 전체 (마지막에 별점 포함)
[/BODY]
[HASHTAGS]#해시태그1 #해시태그2 #해시태그3 #해시태그4 #해시태그5 #해시태그6 #해시태그7 #해시태그8 #해시태그9 #해시태그10[/HASHTAGS]

해시태그 규칙: 정확히 10개, # 붙여서 공백으로 구분, 지역명+카테고리+특징 키워드 조합
`;

    const blogResult = await model.generateContent(prompt);
    const parsed = parseBlogResponse(blogResult.response.text());
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
