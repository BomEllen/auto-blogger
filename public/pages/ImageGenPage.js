export function getHTML() {
  return `
  <div class="image-gen-page">
    <div class="ig-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="ig-hero-inner">
        <div class="hero-badge">GPT Image</div>
        <h1 class="ig-heading">이미지 생성</h1>
        <p class="ig-sub">장소·피사체·촬영 시점을 입력하면 AI가 블로그용 사진을 만들어드려요</p>
      </div>
    </div>

    <div class="ig-wrapper">

      <!-- API 키 입력 -->
      <section class="card ib-card" id="igApiCard">
        <div class="ib-field">
          <label class="ib-label" for="igApiKey">OpenAI API 키</label>
          <p class="ib-hint">이미지 생성에는 OpenAI API 키가 필요해요 (gpt-image-1 모델 사용)</p>
          <div class="ig-api-row">
            <input type="text" name="username" value="OpenAI API Key" autocomplete="username" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" />
            <input type="password" id="igApiKey" name="password" class="ib-input" placeholder="sk-..." autocomplete="current-password" style="flex:1" />
            <button class="btn-ig-connect" id="igConnectBtn">연동</button>
          </div>
          <p class="ig-api-error hidden" id="igApiError"></p>
          <p class="ig-api-ok hidden" id="igApiOk">연동됐어요!</p>
        </div>
      </section>

      <!-- 가이드 폼 -->
      <section class="card ib-card">
        <h2 class="tg-card-title">이미지 정보 입력</h2>

        <!-- 기본 정보 -->
        <div class="ig-form-grid">
          <div class="ib-field">
            <label class="ib-label" for="igLocation">장소 <span style="color:#e05555">*</span></label>
            <input type="text" id="igLocation" class="ib-input" placeholder="예) 성수동 감성 카페, 제주도 해변" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igSituation">상황</label>
            <input type="text" id="igSituation" class="ib-input" placeholder="예) 여자친구 둘 카페 데이트, 혼자 여행 중" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igSubject">피사체 <span style="color:#e05555">*</span></label>
            <input type="text" id="igSubject" class="ib-input" placeholder="예) 아이스라떼, 딸기 케이크" />
          </div>
        </div>

        <!-- 촬영 시점 & 위치 — 강조 섹션 -->
        <div class="ig-perspective-section">
          <div class="ig-perspective-header">
            <span class="ig-perspective-badge">핵심 설정</span>
            <span class="ig-perspective-title">촬영 시점 &amp; 위치</span>
            <span class="ig-perspective-hint">이 두 항목이 이미지 결과에 가장 큰 영향을 줘요</span>
          </div>

          <div class="ib-field">
            <label class="ib-label">촬영 시점</label>
            <div class="ig-viewpoint-group">
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="first-person" checked />
                <span>내 시점 (1인칭)</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="across" />
                <span>맞은편 사람 시점</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="third-party" />
                <span>제3자가 촬영</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="selfie" />
                <span>셀카</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="trailing" />
                <span>뒤에서 따라가는 시점</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="over-shoulder" />
                <span>어깨 너머 시점</span>
              </label>
              <label class="ig-viewpoint-label">
                <input type="radio" name="igViewpoint" value="top-down" />
                <span>위에서 내려다보는 시점</span>
              </label>
            </div>
          </div>

          <div class="ib-field">
            <label class="ib-label" for="igShootingPos">촬영 위치</label>
            <select id="igShootingPos" class="ib-input">
              <option value="seated-table">테이블에 앉아서</option>
              <option value="across-seat">맞은편 자리에서</option>
              <option value="walking">걸어가면서</option>
              <option value="standing">서서</option>
              <option value="window-seat">창가 자리</option>
              <option value="across-street">길 건너편</option>
              <option value="in-vehicle">차량 안</option>
              <option value="custom">자유 입력</option>
            </select>
            <input type="text" id="igShootingPosCustom" class="ib-input ig-custom-input hidden" placeholder="촬영 위치를 직접 입력하세요" />
          </div>
        </div>

        <!-- 나머지 옵션 -->
        <div class="ig-form-grid">
          <div class="ib-field">
            <label class="ib-label" for="igPhotoStyle">사진 스타일</label>
            <select id="igPhotoStyle" class="ib-input">
              <option value="">선택 안 함</option>
              <option value="food-closeup">음식 클로즈업 — 음식이 프레임을 꽉 채움</option>
              <option value="full-table">테이블 전체 — 테이블 위 전체 담기</option>
              <option value="landscape">풍경 중심 — 배경·공간이 주인공</option>
              <option value="portrait">인물 중심 — 사람이 주인공</option>
              <option value="candid">자연스러운 스냅샷 — 연출 없이 찍은 느낌</option>
              <option value="wide">넓게 담기 — 광각으로 공간 전체</option>
              <option value="detail">디테일 강조 — 질감·세부 요소 극대화</option>
            </select>
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igTimeWeather">시간대 / 날씨</label>
            <input type="text" id="igTimeWeather" class="ib-input" placeholder="예) 오후 햇살, 맑은 날, 흐린 저녁" />
          </div>
          <div class="ib-field" style="grid-column: 1 / -1">
            <label class="ib-label" for="igDetails">추가 디테일</label>
            <input type="text" id="igDetails" class="ib-input" placeholder="예) 테이블 위 빛 반사, 따뜻한 색감, 손이 보이게" />
          </div>
        </div>

        <div class="ib-field">
          <label class="ib-label">이미지 비율</label>
          <div class="ig-size-group">
            <label class="ig-size-label"><input type="radio" name="igSize" value="1024x1024" checked /> 정방형 1:1</label>
            <label class="ig-size-label"><input type="radio" name="igSize" value="1536x1024" /> 가로형 3:2</label>
            <label class="ig-size-label"><input type="radio" name="igSize" value="1024x1536" /> 세로형 2:3</label>
          </div>
        </div>

        <button class="btn-ig-generate" id="igGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          이미지 생성하기
        </button>
      </section>

      <!-- 구분선 -->
      <div class="ig-free-divider"><span>또는</span></div>

      <!-- 자유 프롬프트 -->
      <section class="card ib-card">
        <h2 class="tg-card-title">직접 프롬프트 입력</h2>
        <p class="ib-hint" style="margin-top:-10px">가이드 없이 원하는 프롬프트를 직접 입력해서 생성할 수 있어요</p>

        <div class="ib-field">
          <textarea id="igFreePrompt" class="ib-textarea" rows="5"
            placeholder="예) 성수동 카페 창가에 아이스 라떼가 놓여있는 모습, 오후 햇살이 비치는 감성적인 아이폰 사진..."></textarea>
        </div>

        <div class="ib-field">
          <label class="ib-label">이미지 비율</label>
          <div class="ig-size-group">
            <label class="ig-size-label"><input type="radio" name="igFreeSize" value="1024x1024" checked /> 정방형 1:1</label>
            <label class="ig-size-label"><input type="radio" name="igFreeSize" value="1536x1024" /> 가로형 3:2</label>
            <label class="ig-size-label"><input type="radio" name="igFreeSize" value="1024x1536" /> 세로형 2:3</label>
          </div>
        </div>

        <button class="btn-ig-generate btn-ig-generate-free" id="igFreeGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          이미지 생성하기
        </button>
      </section>

      <!-- 구분선 -->
      <div class="ig-free-divider"><span>또는</span></div>

      <!-- 이미지 편집 / 합성 -->
      <section class="card ib-card">
        <h2 class="tg-card-title">이미지 편집 / 합성</h2>
        <p class="ib-hint" style="margin-top:-10px">사진을 올리고 무엇을 추가하거나 바꿀지 입력하면 AI가 합성해드려요</p>

        <div class="ib-field">
          <label class="ib-label">원본 이미지 업로드 <span style="color:#e05555">*</span></label>
          <div class="ig-edit-upload-zone" id="igEditUploadZone">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span class="ig-edit-upload-text">클릭하거나 사진을 드래그하세요</span>
            <span class="ig-edit-upload-sub">PNG · JPG · WEBP</span>
            <input type="file" id="igEditImageInput" accept="image/png,image/jpeg,image/webp" hidden />
          </div>
          <div class="ig-edit-preview-wrap hidden" id="igEditPreviewWrap">
            <img class="ig-edit-preview-img" id="igEditPreviewImg" src="" alt="원본 이미지" />
            <button class="ig-edit-clear-btn" id="igEditClearBtn" title="제거">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div class="ib-field">
          <label class="ib-label" for="igEditPrompt">어떻게 수정할까요? <span style="color:#e05555">*</span></label>
          <textarea id="igEditPrompt" class="ib-textarea" rows="4"
            placeholder="예) 테이블 위에 아이스 아메리카노 한 잔을 추가해줘&#10;예) 배경을 노을 지는 한강으로 바꿔줘&#10;예) 오른쪽 빈 의자에 강아지를 앉혀줘"></textarea>
        </div>

        <div class="ib-field">
          <label class="ib-label">이미지 비율</label>
          <div class="ig-size-group">
            <label class="ig-size-label"><input type="radio" name="igEditSize" value="1024x1024" checked /> 정방형 1:1</label>
            <label class="ig-size-label"><input type="radio" name="igEditSize" value="1536x1024" /> 가로형 3:2</label>
            <label class="ig-size-label"><input type="radio" name="igEditSize" value="1024x1536" /> 세로형 2:3</label>
          </div>
        </div>

        <button class="btn-ig-generate btn-ig-edit" id="igEditGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          이미지 편집하기
        </button>
      </section>

      <!-- 로딩 -->
      <div class="ig-loading hidden" id="igLoading">
        <div class="spinner"></div>
        <span>이미지 생성 중... 약 15~30초 소요돼요</span>
      </div>

      <!-- 에러 -->
      <p class="tg-error hidden" id="igError"></p>

      <!-- 결과 -->
      <section class="card ib-card ig-result-card hidden" id="igResultCard">
        <div class="ig-result-header">
          <h2 class="tg-card-title" style="margin:0">생성된 이미지</h2>
          <div class="ig-result-actions">
            <button class="btn-copy" id="igRegenerateBtn">다시 생성</button>
            <a class="btn-ig-download" id="igDownloadBtn" download="image.png">다운로드</a>
          </div>
        </div>
        <img class="ig-result-img" id="igResultImg" src="" alt="생성된 이미지" />
      </section>

    </div>
  </div>
  `;
}

export function mount() {
  let apiKey = '';
  let lastGenFn = null;

  const igApiKey          = document.getElementById('igApiKey');
  const igConnectBtn      = document.getElementById('igConnectBtn');
  const igApiError        = document.getElementById('igApiError');
  const igApiOk           = document.getElementById('igApiOk');
  const igGenerateBtn     = document.getElementById('igGenerateBtn');
  const igFreeGenerateBtn = document.getElementById('igFreeGenerateBtn');
  const igLoading         = document.getElementById('igLoading');
  const igError           = document.getElementById('igError');
  const igResultCard      = document.getElementById('igResultCard');
  const igResultImg       = document.getElementById('igResultImg');
  const igRegenerateBtn   = document.getElementById('igRegenerateBtn');
  const igDownloadBtn     = document.getElementById('igDownloadBtn');
  const igShootingPos       = document.getElementById('igShootingPos');
  const igShootingPosCustom = document.getElementById('igShootingPosCustom');
  const igEditGenerateBtn   = document.getElementById('igEditGenerateBtn');
  const igEditUploadZone    = document.getElementById('igEditUploadZone');
  const igEditImageInput    = document.getElementById('igEditImageInput');
  const igEditPreviewWrap   = document.getElementById('igEditPreviewWrap');
  const igEditPreviewImg    = document.getElementById('igEditPreviewImg');
  const igEditClearBtn      = document.getElementById('igEditClearBtn');

  let editImageFile = null;

  // 촬영 위치 자유 입력 토글
  igShootingPos.addEventListener('change', () => {
    igShootingPosCustom.classList.toggle('hidden', igShootingPos.value !== 'custom');
  });

  // 이미지 업로드 존
  igEditUploadZone.addEventListener('click', () => igEditImageInput.click());
  igEditUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); igEditUploadZone.classList.add('drag-over'); });
  igEditUploadZone.addEventListener('dragleave', () => igEditUploadZone.classList.remove('drag-over'));
  igEditUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    igEditUploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setEditImage(file);
  });
  igEditImageInput.addEventListener('change', () => {
    if (igEditImageInput.files[0]) setEditImage(igEditImageInput.files[0]);
  });
  igEditClearBtn.addEventListener('click', () => {
    editImageFile = null;
    igEditImageInput.value = '';
    igEditPreviewWrap.classList.add('hidden');
    igEditUploadZone.classList.remove('hidden');
  });

  function setEditImage(file) {
    editImageFile = file;
    igEditPreviewImg.src = URL.createObjectURL(file);
    igEditUploadZone.classList.add('hidden');
    igEditPreviewWrap.classList.remove('hidden');
  }

  // 저장된 OpenAI 키 자동 복구
  const saved = sessionStorage.getItem('openai_image_key');
  if (saved) { igApiKey.value = saved; connect(saved); }

  igConnectBtn.addEventListener('click', () => connect(igApiKey.value.trim()));
  igApiKey.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(igApiKey.value.trim()); });

  function connect(key) {
    if (!key) { showApiError('API 키를 입력해주세요.'); return; }
    apiKey = key;
    sessionStorage.setItem('openai_image_key', key);
    igApiError.classList.add('hidden');
    igApiOk.classList.remove('hidden');
    igApiOk.textContent = `연동됐어요! (${key.substring(0, 8)}••••)`;
  }

  function showApiError(msg) { igApiError.textContent = msg; igApiError.classList.remove('hidden'); igApiOk.classList.add('hidden'); }

  function getSize()     { return document.querySelector('input[name="igSize"]:checked')?.value     || '1024x1024'; }
  function getFreeSize() { return document.querySelector('input[name="igFreeSize"]:checked')?.value || '1024x1024'; }
  function getViewpoint() { return document.querySelector('input[name="igViewpoint"]:checked')?.value || 'first-person'; }
  function getShootingPosition() {
    const val = igShootingPos.value;
    if (val === 'custom') return igShootingPosCustom.value.trim();
    return val;
  }

  function setGenerating(on) {
    igGenerateBtn.disabled     = on;
    igFreeGenerateBtn.disabled = on;
    igEditGenerateBtn.disabled = on;
    igRegenerateBtn.disabled   = on;
    if (on) {
      igError.classList.add('hidden');
      igResultCard.classList.add('hidden');
      igLoading.classList.remove('hidden');
    } else {
      igLoading.classList.add('hidden');
    }
  }

  async function runGenerate(body) {
    setGenerating(true);
    try {
      const resp = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `오류 ${resp.status}`);
      igResultImg.src = data.image;
      igDownloadBtn.href = data.image;
      igResultCard.classList.remove('hidden');
      igResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      igError.textContent = err.message;
      igError.classList.remove('hidden');
    } finally {
      setGenerating(false);
    }
  }

  async function generate() {
    if (!apiKey) { showApiError('먼저 OpenAI API 키를 연동해주세요.'); return; }
    const location = document.getElementById('igLocation').value.trim();
    const subject  = document.getElementById('igSubject').value.trim();
    if (!location) { igError.textContent = '장소를 입력해주세요.'; igError.classList.remove('hidden'); return; }
    if (!subject)  { igError.textContent = '피사체를 입력해주세요.'; igError.classList.remove('hidden'); return; }
    lastGenFn = generate;
    await runGenerate({
      location,
      subject,
      situation:       document.getElementById('igSituation').value.trim(),
      viewpoint:       getViewpoint(),
      shootingPosition: getShootingPosition(),
      photoStyle:      document.getElementById('igPhotoStyle').value,
      timeWeather:     document.getElementById('igTimeWeather').value.trim(),
      details:         document.getElementById('igDetails').value.trim(),
      size:            getSize(),
    });
  }

  async function generateFree() {
    if (!apiKey) { showApiError('먼저 OpenAI API 키를 연동해주세요.'); return; }
    const rawPrompt = document.getElementById('igFreePrompt').value.trim();
    if (!rawPrompt) { igError.textContent = '프롬프트를 입력해주세요.'; igError.classList.remove('hidden'); return; }
    lastGenFn = generateFree;
    await runGenerate({ rawPrompt, size: getFreeSize() });
  }

  async function generateEdit() {
    if (!apiKey) { showApiError('먼저 OpenAI API 키를 연동해주세요.'); return; }
    if (!editImageFile) { igError.textContent = '편집할 이미지를 업로드해주세요.'; igError.classList.remove('hidden'); return; }
    const prompt = document.getElementById('igEditPrompt').value.trim();
    if (!prompt) { igError.textContent = '수정 내용을 입력해주세요.'; igError.classList.remove('hidden'); return; }
    const size = document.querySelector('input[name="igEditSize"]:checked')?.value || '1024x1024';

    lastGenFn = generateEdit;
    setGenerating(true);
    try {
      const fd = new FormData();
      fd.append('image', editImageFile);
      fd.append('prompt', prompt);
      fd.append('size', size);
      const resp = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `오류 ${resp.status}`);
      igResultImg.src = data.image;
      igDownloadBtn.href = data.image;
      igResultCard.classList.remove('hidden');
      igResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      igError.textContent = err.message;
      igError.classList.remove('hidden');
    } finally {
      setGenerating(false);
    }
  }

  igGenerateBtn.addEventListener('click', generate);
  igFreeGenerateBtn.addEventListener('click', generateFree);
  igEditGenerateBtn.addEventListener('click', generateEdit);
  igRegenerateBtn.addEventListener('click', () => lastGenFn?.());
}
