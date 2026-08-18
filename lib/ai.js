const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

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
    || msg.toLowerCase().includes('service unavailable')
    || msg.startsWith('timeout_');
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
  if (msg.startsWith('timeout_')) {
    return `AI가 응답하는 데 시간이 오래 걸리고 있어요. 사진이 많을수록 시간이 더 걸릴 수 있어요. 잠시 후 다시 시도해주세요.`;
  }
  return msg.substring(0, 200);
}

module.exports = {
  GEMINI_MODEL,
  FALLBACK_MODEL,
  withTimeout,
  isRetryable,
  withRetry,
  withFallback,
  friendlyGeminiError,
};
