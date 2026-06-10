import { copyText } from '../utils.js';

export function getHTML() {
  return `
  <div class="info-blog-page">
    <div class="info-blog-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="info-blog-hero-inner">
        <div class="hero-badge">정보성 콘텐츠</div>
        <h1 class="info-blog-heading">정보성 블로그 작성</h1>
        <p class="info-blog-sub">키워드와 실제 정보를 입력하면 SEO 최적화 정보성 글을 작성해드려요</p>
      </div>
    </div>

    <div class="info-blog-wrapper">

      <!-- API 키 상태 -->
      <div class="tg-api-connected hidden" id="ibApiConnected">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span id="ibMaskedKey"></span>
      </div>
      <div class="tg-api-missing hidden" id="ibApiMissing">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <span>API 키가 없어요. <a href="#/" class="tg-api-link">홈에서 먼저 연동</a>하고 돌아오세요.</span>
      </div>

      <!-- 입력 폼 -->
      <section class="card ib-card">
        <h2 class="tg-card-title">글 정보 입력</h2>

        <div class="ib-field">
          <label class="ib-label">핵심 키워드 <span class="req">*</span></label>
          <p class="ib-hint">이 글이 검색되길 원하는 핵심 단어</p>
          <input type="text" id="ibMainKeyword" class="ib-input" placeholder="예) 강남 맛집 추천" />
        </div>

        <div class="ib-field">
          <label class="ib-label">보조 키워드</label>
          <p class="ib-hint">함께 노출되면 좋은 연관 키워드 (쉼표로 구분)</p>
          <input type="text" id="ibSubKeywords" class="ib-input" placeholder="예) 강남 점심, 강남 혼밥, 직장인 밥집" />
        </div>

        <div class="ib-field">
          <label class="ib-label">타겟 독자</label>
          <p class="ib-hint">이 글을 읽을 독자층</p>
          <input type="text" id="ibTargetReader" class="ib-input" placeholder="예) 강남에서 점심 찾는 직장인" />
        </div>

        <div class="ib-field">
          <label class="ib-label">실제 정보 <span class="req">*</span></label>
          <p class="ib-hint">직접 경험한 내용이나 사진에서 뽑은 정보를 자유롭게 적어주세요</p>
          <textarea id="ibActualInfo" class="ib-textarea" rows="8"
            placeholder="예) 강남역 2번 출구 도보 3분&#10;메뉴: 된장찌개 8,000원, 제육볶음 9,000원&#10;점심시간 웨이팅 10분 정도&#10;혼밥 가능한 1인석 있음&#10;깔끔하고 집밥 느낌"></textarea>
          <div class="tg-char-count"><span id="ibCharCount">0</span>자</div>
        </div>

        <div class="ib-field">
          <label class="ib-label">삽입할 제휴 링크</label>
          <p class="ib-hint">글 안에 자연스럽게 넣을 링크 (없으면 비워두세요)</p>
          <input type="text" id="ibAffiliateLink" class="ib-input" placeholder="예) https://..." />
        </div>

        <button class="btn-tg-generate" id="ibGenerateBtn" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          블로그 글 생성하기
        </button>
      </section>

      <!-- 로딩 -->
      <div class="tg-loading hidden" id="ibLoading">
        <div class="spinner"></div>
        <span>글 작성 중...</span>
      </div>

      <!-- 에러 -->
      <p class="tg-error hidden" id="ibError"></p>

      <!-- 결과 -->
      <section class="card tg-result-card hidden" id="ibResultCard">
        <div class="result-header">
          <h2>완성된 블로그 글</h2>
          <div class="result-actions">
            <button class="btn-copy" id="ibCopyTitle">제목 복사</button>
            <button class="btn-copy" id="ibCopyBody">본문 복사</button>
            <button class="btn-copy btn-copy-all" id="ibCopyAll">전체 복사</button>
          </div>
        </div>

        <div class="result-section">
          <div class="result-label-row">
            <span class="result-label">제목</span>
          </div>
          <div class="result-title-box" id="ibTitleOutput" contenteditable="true" spellcheck="false"></div>
        </div>

        <div class="result-section">
          <div class="result-label-row">
            <span class="result-label">본문</span>
          </div>
          <div class="result-body-box" id="ibBodyOutput" contenteditable="true" spellcheck="false"></div>
        </div>

        <div class="result-section">
          <div class="result-label-row">
            <span class="result-label">해시태그</span>
            <span class="result-hint">각 태그를 클릭하면 복사돼요</span>
          </div>
          <div class="result-tags-box" id="ibTagsOutput"></div>
        </div>
      </section>

    </div>
  </div>
  `;
}

export function mount() {
  const apiKey = sessionStorage.getItem('gemini_key');

  const ibApiConnected = document.getElementById('ibApiConnected');
  const ibApiMissing = document.getElementById('ibApiMissing');
  const ibMaskedKey = document.getElementById('ibMaskedKey');
  const ibMainKeyword = document.getElementById('ibMainKeyword');
  const ibSubKeywords = document.getElementById('ibSubKeywords');
  const ibTargetReader = document.getElementById('ibTargetReader');
  const ibActualInfo = document.getElementById('ibActualInfo');
  const ibAffiliateLink = document.getElementById('ibAffiliateLink');
  const ibCharCount = document.getElementById('ibCharCount');
  const ibGenerateBtn = document.getElementById('ibGenerateBtn');
  const ibLoading = document.getElementById('ibLoading');
  const ibError = document.getElementById('ibError');
  const ibResultCard = document.getElementById('ibResultCard');
  const ibTitleOutput = document.getElementById('ibTitleOutput');
  const ibBodyOutput = document.getElementById('ibBodyOutput');
  const ibTagsOutput = document.getElementById('ibTagsOutput');

  if (apiKey) {
    ibApiConnected.classList.remove('hidden');
    ibMaskedKey.textContent = apiKey.slice(0, 8) + '••••••••••••••••••••' + apiKey.slice(-4);
    ibGenerateBtn.disabled = false;
  } else {
    ibApiMissing.classList.remove('hidden');
  }

  ibActualInfo.addEventListener('input', () => {
    ibCharCount.textContent = ibActualInfo.value.length.toLocaleString();
  });

  ibGenerateBtn.addEventListener('click', async () => {
    const mainKeyword = ibMainKeyword.value.trim();
    const actualInfo = ibActualInfo.value.trim();
    if (!mainKeyword || !actualInfo || !apiKey) return;

    ibError.classList.add('hidden');
    ibResultCard.classList.add('hidden');
    ibLoading.classList.remove('hidden');
    ibGenerateBtn.disabled = true;

    try {
      const res = await fetch('/api/generate-info-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          mainKeyword,
          subKeywords: ibSubKeywords.value,
          targetReader: ibTargetReader.value,
          actualInfo,
          affiliateLink: ibAffiliateLink.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '글 생성에 실패했어요.');

      ibTitleOutput.textContent = data.title;
      ibBodyOutput.textContent = data.body;

      ibTagsOutput.innerHTML = '';
      data.hashtags.split(/\s+/).filter(t => t).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.textContent = tag.startsWith('#') ? tag : '#' + tag;
        chip.addEventListener('click', () => copyText(chip.textContent, '태그'));
        ibTagsOutput.appendChild(chip);
      });

      ibResultCard.classList.remove('hidden');
    } catch (err) {
      ibError.textContent = err.message;
      ibError.classList.remove('hidden');
    } finally {
      ibLoading.classList.add('hidden');
      ibGenerateBtn.disabled = false;
    }
  });

  document.getElementById('ibCopyTitle').addEventListener('click', () => {
    copyText(ibTitleOutput.textContent, '제목');
  });
  document.getElementById('ibCopyBody').addEventListener('click', () => {
    copyText(ibBodyOutput.textContent, '본문');
  });
  document.getElementById('ibCopyAll').addEventListener('click', () => {
    const all = `${ibTitleOutput.textContent}\n\n${ibBodyOutput.textContent}\n\n${ibTagsOutput.textContent}`;
    copyText(all, '전체');
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
