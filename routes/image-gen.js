const express = require('express');
const fs = require('fs');
const { OpenAI } = require('openai');
const { upload, cleanupFiles } = require('../lib/upload');

const router = express.Router();

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

router.post('/generate-image', async (req, res) => {
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
router.post('/edit-image', upload.single('image'), async (req, res) => {
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

module.exports = router;
