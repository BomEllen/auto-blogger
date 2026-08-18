const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const { GEMINI_MODEL, FALLBACK_MODEL, withTimeout, withRetry, withFallback, friendlyGeminiError } = require('../lib/ai');
const { upload, imagePart, cleanupFiles } = require('../lib/upload');
const { fetchNaverBlogTitles } = require('../lib/naver');

const router = express.Router();

// review-blog-guide.md(연녹 문체)에 의존 — 리뷰 블로그와 공유하는 자산이라 여기서도 독립적으로 로드함
let STYLE_GUIDE = '';
try {
  STYLE_GUIDE = fs.readFileSync(path.join(__dirname, '../prompts/review-blog-guide.md'), 'utf-8').trim();
} catch {
  // 파일 없으면 무시
}

// ── 제목 생성 ──
router.post('/generate-title', async (req, res) => {
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

// ── 해시태그 생성 ──
router.post('/generate-hashtags', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  const { body, naverQuery } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: '본문 내용이 없습니다.' });

  try {
    const regionKeyword = (naverQuery || '').split(/\s+/).slice(0, 2).join(' ');
    const [naverTitles, naverHashtagTitles] = await Promise.all([
      fetchNaverBlogTitles(naverQuery),
      regionKeyword ? fetchNaverBlogTitles(regionKeyword) : Promise.resolve([]),
    ]);
    const naverBlock = naverTitles.length > 0
      ? `\n[네이버 상위 노출 제목 샘플 — 자주 등장하는 키워드를 해시태그에 반영하세요]\n${naverTitles.slice(0, 15).join('\n')}\n`
      : '';
    const naverHashtagBlock = naverHashtagTitles.length > 0
      ? `\n[지역+카테고리 관련 네이버 블로그 제목 — 해당 지역에서 실제로 쓰이는 키워드를 해시태그에 반영하세요]\n${naverHashtagTitles.slice(0, 20).join('\n')}\n`
      : '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `아래 블로그 본문을 읽고 네이버 블로그에 최적화된 해시태그 20개를 생성하세요.
${naverBlock}${naverHashtagBlock}
[해시태그 작성 규칙]
1. 정확히 20개를 생성한다.
2. 각 해시태그는 #단어 형식으로, 공백으로 구분한다. (예: #성수카페 #데이트코스 #내돈내산)
3. 네이버에서 실제로 검색되는 키워드를 우선으로 선정한다.
4. 지역명+카테고리, 특징 키워드, 감성 키워드를 골고루 섞는다.
5. 본문 내용과 관련 없는 키워드는 사용하지 않는다.

[본문]
${body.substring(0, 3000)}

해시태그 20개만 출력하세요. #단어 형식으로 공백으로 구분해서. 다른 설명 없이.`;
    const result = await withFallback(
      () => withRetry(() => model.generateContent(prompt)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        return withRetry(() => fb.generateContent(prompt), 3, 2000);
      }
    );
    res.json({ hashtags: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  }
});

// ── 섹션 보완 ──
router.post('/improve-section', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  const { body, instruction } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: '본문을 입력해주세요.' });
  if (!instruction?.trim()) return res.status(400).json({ error: '보완할 내용을 입력해주세요.' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: STYLE_GUIDE });
    const prompt = `아래 블로그 본문을 읽고, 요청한 섹션을 보완하거나 추가해주세요.

[기존 본문]
${body.substring(0, 4000)}

[보완 요청]
${instruction.trim()}

[작성 규칙]
- 기존 본문의 말투와 스타일을 그대로 유지하세요.
- 요청한 내용만 새로 작성해서 출력하세요. 기존 본문 전체를 다시 쓰지 마세요.
- 마크다운 문법(**굵게**, ##헤더 등) 사용 금지.

보완된 섹션 텍스트만 출력하세요.`;
    const result = await withFallback(
      () => withRetry(() => withTimeout(() => model.generateContent(prompt), 30000)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: STYLE_GUIDE });
        return withRetry(() => withTimeout(() => fb.generateContent(prompt), 30000), 3, 2000);
      }
    );
    res.json({ result: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  }
});

// ── 사진 설명 생성 ──
router.post('/describe-photo', upload.single('photo'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  if (!req.file) return res.status(400).json({ error: '사진을 업로드해주세요.' });
  const openaiKey = req.headers['x-openai-key'] || '';
  try {
    let desc;
    if (openaiKey) {
      const base64 = fs.readFileSync(req.file.path).toString('base64');
      const gptClient = new OpenAI({ apiKey: openaiKey });
      const gptResp = await withTimeout(() => gptClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${req.file.mimetype || 'image/jpeg'};base64,${base64}`, detail: 'auto' } },
          { type: 'text', text: '이 사진을 보고 네이버 블로그 리뷰에 사용할 설명을 2~3줄로 작성해주세요. 사진에 실제로 보이는 내용만 작성하고, 구어체 블로그 말투로 써주세요. 설명만 출력하세요.' },
        ]}],
        max_tokens: 300,
      }), 30000);
      desc = gptResp.choices[0].message.content.trim();
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: STYLE_GUIDE });
      const result = await withRetry(() => withTimeout(() => model.generateContent([
        imagePart(req.file),
        '이 사진을 보고 네이버 블로그 리뷰에 사용할 설명을 2~3줄로 작성해주세요. 사진에 실제로 보이는 내용만 작성하고, 구어체 블로그 말투로 써주세요. 설명만 출력하세요.',
      ]), 30000));
      desc = result.response.text().trim();
    }
    res.json({ description: desc });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  } finally {
    cleanupFiles(req.file ? [req.file] : []);
  }
});

// ── 정보 검색 & 블로그 작성 ──
router.post('/research-blog', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API 키가 필요합니다.' });
  const { topic } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: '주제를 입력해주세요.' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const searchModel = genAI.getGenerativeModel({ model: GEMINI_MODEL, tools: [{ googleSearch: {} }] });
    const searchResult = await withRetry(() => withTimeout(() => searchModel.generateContent(
      `오늘 날짜: ${today}\n아래 주제에 대해 최신·정확한 정보를 조사해주세요.\n\n${topic.trim()}\n\n사실 위주로 정리하세요.`
    ), 30000));
    const researched = searchResult.response.text().trim();

    const blogModel = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: STYLE_GUIDE });
    const blogPrompt = `아래 조사된 정보를 바탕으로 네이버 블로그용 글을 작성해주세요.

[주제]
${topic.trim()}

[조사된 정보]
${researched}

[작성 규칙]
- 연녹 블로그 스타일(구어체, 자연스러운 말투)로 작성
- 마크다운 문법(**굵게**, ##헤더 등) 사용 금지
- 조사된 정보를 바탕으로 정확하게 작성
- 블로그 본문 섹션 형식으로 작성 (300~600자)

본문만 출력하세요.`;
    const blogResult = await withFallback(
      () => withRetry(() => withTimeout(() => blogModel.generateContent(blogPrompt), 40000)),
      () => {
        const fb = genAI.getGenerativeModel({ model: FALLBACK_MODEL, systemInstruction: STYLE_GUIDE });
        return withRetry(() => withTimeout(() => fb.generateContent(blogPrompt), 40000), 3, 2000);
      }
    );
    res.json({ result: blogResult.response.text().trim() });
  } catch (err) {
    res.status(500).json({ error: friendlyGeminiError(err) });
  }
});

module.exports = router;
