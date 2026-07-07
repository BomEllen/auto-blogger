import { copyText } from '../utils.js';

export function getHTML() {
  return `
  <div class="title-gen-page">
    <div class="title-gen-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="title-gen-hero-inner">
        <div class="hero-badge">SEO 최적화</div>
        <h1 class="title-gen-heading">블로그 제목 생성</h1>
        <p class="title-gen-sub">본문을 붙여넣으면 네이버 SEO에 최적화된 제목을 만들어드려요</p>
      </div>
    </div>

    <div class="title-gen-wrapper">

      <!-- API 키 상태 -->
      <div class="tg-api-status" id="tgApiStatus">
        <div class="tg-api-connected hidden" id="tgApiConnected">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span id="tgMaskedKey"></span>
        </div>
        <div class="tg-api-missing hidden" id="tgApiMissing">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>API 키가 없어요. <a href="#/" class="tg-api-link">홈에서 먼저 연동</a>하고 돌아오세요.</span>
        </div>
      </div>

      <!-- 입력 카드 -->
      <section class="card tg-card">
        <div class="tg-card-header">
          <h2 class="tg-card-title">블로그 본문</h2>
          <p class="tg-card-desc">완성된 블로그 본문을 아래에 붙여넣어 주세요</p>
        </div>

        <div class="tg-naver-row">
          <label class="tg-naver-label" for="tgNaverQuery">
            네이버 검색 키워드
            <span class="tag-optional">선택</span>
          </label>
          <p class="tg-naver-hint">입력하면 네이버에서 실제 상위 노출 제목을 참고해서 만들어요 (예: 성수동 카페)</p>
          <input type="text" id="tgNaverQuery" class="tg-naver-input" placeholder="예) 성수동 카페, 홍대 맛집" />
        </div>

        <textarea
          id="tgBodyInput"
          class="tg-body-textarea"
          placeholder="블로그 본문을 여기에 붙여넣으세요..."
          rows="12"
        ></textarea>
        <div class="tg-char-count"><span id="tgCharCount">0</span>자</div>
        <button class="btn-tg-generate" id="tgGenerateBtn" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          제목 생성하기
        </button>
      </section>

      <!-- 결과 카드 -->
      <section class="card tg-result-card hidden" id="tgResultCard">
        <div class="tg-result-header">
          <h2 class="tg-result-title">생성된 제목</h2>
          <button class="btn-copy" id="tgCopyBtn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
            복사
          </button>
        </div>
        <div class="tg-result-box" id="tgResultBox" contenteditable="true" spellcheck="false"></div>
        <p class="tg-result-hint">제목을 클릭해서 직접 수정할 수 있어요</p>
      </section>

      <!-- 에러 -->
      <p class="tg-error hidden" id="tgError"></p>

      <!-- 로딩 -->
      <div class="tg-loading hidden" id="tgLoading">
        <div class="spinner"></div>
        <span>제목 생성 중...</span>
      </div>

    </div>
  </div>
  `;
}

export function mount() {
  const apiKey = sessionStorage.getItem('gemini_key');

  const tgApiConnected = document.getElementById('tgApiConnected');
  const tgApiMissing = document.getElementById('tgApiMissing');
  const tgMaskedKey = document.getElementById('tgMaskedKey');
  const tgBodyInput = document.getElementById('tgBodyInput');
  const tgCharCount = document.getElementById('tgCharCount');
  const tgGenerateBtn = document.getElementById('tgGenerateBtn');
  const tgResultCard = document.getElementById('tgResultCard');
  const tgResultBox = document.getElementById('tgResultBox');
  const tgCopyBtn = document.getElementById('tgCopyBtn');
  const tgError = document.getElementById('tgError');
  const tgLoading = document.getElementById('tgLoading');

  if (apiKey) {
    tgApiConnected.classList.remove('hidden');
    tgMaskedKey.textContent = apiKey.slice(0, 8) + '••••••••••••••••••••' + apiKey.slice(-4);
    tgGenerateBtn.disabled = false;
  } else {
    tgApiMissing.classList.remove('hidden');
  }

  tgBodyInput.addEventListener('input', () => {
    const len = tgBodyInput.value.length;
    tgCharCount.textContent = len.toLocaleString();
    tgGenerateBtn.disabled = !apiKey || len < 30;
  });

  tgGenerateBtn.addEventListener('click', async () => {
    const body = tgBodyInput.value.trim();
    if (!body || !apiKey) return;

    tgError.classList.add('hidden');
    tgResultCard.classList.add('hidden');
    tgLoading.classList.remove('hidden');
    tgGenerateBtn.disabled = true;

    try {
      const naverQuery = document.getElementById('tgNaverQuery').value.trim();
      const res = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ body, ...(naverQuery && { naverQuery }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '제목 생성에 실패했어요.');
      tgResultBox.textContent = data.title;
      tgResultCard.classList.remove('hidden');
    } catch (err) {
      tgError.textContent = err.message;
      tgError.classList.remove('hidden');
    } finally {
      tgLoading.classList.add('hidden');
      tgGenerateBtn.disabled = false;
    }
  });

  tgCopyBtn.addEventListener('click', () => {
    copyText(tgResultBox.textContent, '제목');
  });

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('customModal');
      if (!overlay.classList.contains('hidden') && !overlay.dataset.confirm) {
        overlay.classList.add('hidden');
      }
    }
  };
  document.addEventListener('keydown', handleKeydown);

  return function unmount() {
    document.removeEventListener('keydown', handleKeydown);
  };
}
