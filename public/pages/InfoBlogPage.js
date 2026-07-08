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
          <input type="text" id="ibMainKeyword" class="ib-input" placeholder="예) 6월 오사카 날씨" />
        </div>

        <div class="ib-field">
          <label class="ib-label">보조 키워드</label>
          <p class="ib-hint">함께 노출되면 좋은 연관 키워드 (쉼표로 구분)</p>
          <input type="text" id="ibSubKeywords" class="ib-input" placeholder="예) 오사카 장마, 오사카 옷차림, 오사카 여행 준비물" />
        </div>

        <div class="ib-field">
          <label class="ib-label">타겟 독자</label>
          <p class="ib-hint">이 글을 읽을 독자층</p>
          <input type="text" id="ibTargetReader" class="ib-input" placeholder="예) 6월에 오사카 여행 가는 20~30대" />
        </div>

        <div class="ib-field">
          <label class="ib-label">검색해서 넣을 정보 항목</label>
          <p class="ib-hint">AI가 오늘 날짜 기준으로 직접 검색해서 글에 반영해드려요 (없으면 비워두세요)</p>
          <textarea id="ibSearchTopics" class="ib-textarea" rows="4"
            placeholder="예) 축제별 핵심 볼거리와 시작 시간&#10;불꽃축제 유료 관람석 예약 여부, 무료 명당 포인트&#10;유카타 대여 위치와 가격대"></textarea>
        </div>

        <div class="ib-field">
          <label class="ib-label">실제 정보 <span class="req">*</span></label>
          <p class="ib-hint">직접 경험한 내용이나 사진에서 뽑은 정보를 자유롭게 적어주세요</p>
          <textarea id="ibActualInfo" class="ib-textarea" rows="8"
            placeholder="예) 첫날 비바람 강했고 둘째날부터 흐림·맑음 반복&#10;낮엔 덥고 습한데 실내는 냉방 강해서 얇은 겉옷 필요&#10;평균 기온 24도 안팎, 우산·방수신발 챙김&#10;비 오는 날엔 우메다 지하상가, 가이유칸 등 실내 위주로 다님"></textarea>
          <div class="tg-char-count"><span id="ibCharCount">0</span>자</div>
        </div>

        <div class="ib-field">
          <label class="ib-label">삽입할 제휴 링크</label>
          <p class="ib-hint">글 안에 자연스럽게 넣을 링크 (없으면 비워두세요)</p>
          <input type="text" id="ibAffiliateLink" class="ib-input" placeholder="예) https://..." />
        </div>

        <div class="ib-field">
          <label class="ib-label">참고 링크</label>
          <p class="ib-hint">AI가 글 쓰기 전에 참고할 URL (한 줄에 하나씩, 없으면 비워두세요)</p>
          <textarea id="ibRefLinks" class="ib-textarea" rows="3"
            placeholder="예) https://www.jma.go.jp/osaka-june&#10;https://..."></textarea>
        </div>

        <div class="ib-field">
          <label class="ib-label">참고 이미지</label>
          <p class="ib-hint">통계표·기사 캡처·데이터 사진 등 — AI가 읽고 글에 반영해드려요 (여러 장 가능)</p>
          <div class="ib-ref-upload-zone" id="ibRefUploadZone">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span>클릭하거나 드래그해서 이미지 추가</span>
            <input type="file" id="ibRefImageInput" accept="image/*" multiple hidden />
          </div>
          <div class="ib-ref-previews" id="ibRefPreviews"></div>
        </div>

        <button class="btn-tg-generate" id="ibGenerateBtn">
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

        <div class="result-section hidden" id="ibLinkSuggestionSection">
          <div class="result-label-row">
            <span class="result-label">제휴 링크 추천</span>
            <span class="result-hint">링크를 입력하지 않아서 AI가 추천해드려요</span>
          </div>
          <div class="ib-link-suggestion-box" id="ibLinkSuggestionOutput"></div>
        </div>

      </section>

    </div>
  </div>
  `;
}

export function mount() {
  const apiKey = sessionStorage.getItem('gemini_key');
  let ibRefFiles = [];

  const ibApiConnected = document.getElementById('ibApiConnected');
  const ibApiMissing = document.getElementById('ibApiMissing');
  const ibMaskedKey = document.getElementById('ibMaskedKey');
  const ibMainKeyword = document.getElementById('ibMainKeyword');
  const ibSubKeywords = document.getElementById('ibSubKeywords');
  const ibTargetReader = document.getElementById('ibTargetReader');
  const ibActualInfo = document.getElementById('ibActualInfo');
  const ibAffiliateLink = document.getElementById('ibAffiliateLink');
  const ibSearchTopics = document.getElementById('ibSearchTopics');
  const ibRefLinks = document.getElementById('ibRefLinks');
  const ibRefUploadZone = document.getElementById('ibRefUploadZone');
  const ibRefImageInput = document.getElementById('ibRefImageInput');
  const ibRefPreviews = document.getElementById('ibRefPreviews');
  const ibCharCount = document.getElementById('ibCharCount');
  const ibGenerateBtn = document.getElementById('ibGenerateBtn');
  const ibLoading = document.getElementById('ibLoading');
  const ibError = document.getElementById('ibError');
  const ibResultCard = document.getElementById('ibResultCard');
  const ibTitleOutput = document.getElementById('ibTitleOutput');
  const ibBodyOutput = document.getElementById('ibBodyOutput');
  const ibLinkSuggestionSection = document.getElementById('ibLinkSuggestionSection');
  const ibLinkSuggestionOutput = document.getElementById('ibLinkSuggestionOutput');

  if (apiKey) {
    ibApiConnected.classList.remove('hidden');
    ibMaskedKey.textContent = apiKey.slice(0, 8) + '••••••••••••••••••••' + apiKey.slice(-4);
  } else {
    ibApiMissing.classList.remove('hidden');
  }

  ibActualInfo.addEventListener('input', () => {
    ibCharCount.textContent = ibActualInfo.value.length.toLocaleString();
  });

  function renderRefPreviews() {
    ibRefPreviews.innerHTML = '';
    ibRefFiles.forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const thumb = document.createElement('div');
      thumb.className = 'ib-ref-thumb';
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      const del = document.createElement('button');
      del.className = 'ib-ref-thumb-del';
      del.title = '삭제';
      del.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
      del.addEventListener('click', () => { ibRefFiles.splice(i, 1); renderRefPreviews(); });
      thumb.append(img, del);
      ibRefPreviews.appendChild(thumb);
    });
  }

  ibRefUploadZone.addEventListener('click', () => ibRefImageInput.click());
  ibRefUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); ibRefUploadZone.classList.add('drag-over'); });
  ibRefUploadZone.addEventListener('dragleave', () => ibRefUploadZone.classList.remove('drag-over'));
  ibRefUploadZone.addEventListener('drop', (e) => {
    e.preventDefault(); ibRefUploadZone.classList.remove('drag-over');
    ibRefFiles.push(...Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
    renderRefPreviews();
  });
  ibRefImageInput.addEventListener('change', () => {
    ibRefFiles.push(...Array.from(ibRefImageInput.files));
    ibRefImageInput.value = '';
    renderRefPreviews();
  });

  ibGenerateBtn.addEventListener('click', async () => {
    const mainKeyword = ibMainKeyword.value.trim();
    const actualInfo = ibActualInfo.value.trim();

    if (!apiKey) {
      ibError.textContent = 'API 키가 없어요. 홈에서 먼저 Gemini API 키를 연동해주세요.';
      ibError.classList.remove('hidden');
      return;
    }
    if (!mainKeyword) {
      ibError.textContent = '핵심 키워드를 입력해주세요.';
      ibError.classList.remove('hidden');
      ibMainKeyword.focus();
      return;
    }
    if (!actualInfo) {
      ibError.textContent = '실제 정보를 입력해주세요.';
      ibError.classList.remove('hidden');
      ibActualInfo.focus();
      return;
    }

    ibError.classList.add('hidden');
    ibResultCard.classList.add('hidden');
    ibLoading.classList.remove('hidden');
    ibGenerateBtn.disabled = true;

    try {
      const fd = new FormData();
      fd.append('mainKeyword', mainKeyword);
      fd.append('subKeywords', ibSubKeywords.value);
      fd.append('targetReader', ibTargetReader.value);
      fd.append('searchTopics', ibSearchTopics.value);
      fd.append('actualInfo', actualInfo);
      fd.append('affiliateLink', ibAffiliateLink.value);
      fd.append('refLinks', ibRefLinks.value);
      ibRefFiles.forEach(f => fd.append('refImages', f));

      const res = await fetch('/api/generate-info-blog', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '글 생성에 실패했어요.');

      ibTitleOutput.textContent = data.title;
      ibBodyOutput.textContent = data.body;

      if (data.linkSuggestion) {
        ibLinkSuggestionOutput.textContent = data.linkSuggestion;
        ibLinkSuggestionSection.classList.remove('hidden');
      } else {
        ibLinkSuggestionSection.classList.add('hidden');
      }

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
    const all = `${ibTitleOutput.textContent}\n\n${ibBodyOutput.textContent}`;
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
