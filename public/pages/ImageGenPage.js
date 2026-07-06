export function getHTML() {
  return `
  <div class="image-gen-page">
    <div class="ig-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="ig-hero-inner">
        <div class="hero-badge">GPT Image</div>
        <h1 class="ig-heading">이미지 생성</h1>
        <p class="ig-sub">장소·피사체·분위기를 입력하면 AI가 블로그용 사진을 만들어드려요</p>
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

        <div class="ig-form-grid">
          <div class="ib-field">
            <label class="ib-label" for="igLocation">장소 <span style="color:#e05555">*</span></label>
            <input type="text" id="igLocation" class="ib-input" placeholder="예) 성수동 감성 카페" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igSubject">피사체 <span style="color:#e05555">*</span></label>
            <input type="text" id="igSubject" class="ib-input" placeholder="예) 아이스 라떼와 케이크" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igSituation">상황</label>
            <input type="text" id="igSituation" class="ib-input" placeholder="예) 친구와 카페 데이트" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igTimeWeather">시간대 / 날씨</label>
            <input type="text" id="igTimeWeather" class="ib-input" placeholder="예) 오후 햇살, 맑은 날" />
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igComposition">구도</label>
            <select id="igComposition" class="ib-input ig-composition-select">
              <option value="">선택 안 함</option>
              <option value="위에서 내려다보는 탑뷰 (flat lay)">탑뷰 / Flat Lay — 위에서 내려다보기</option>
              <option value="피사체와 눈높이를 맞춘 정면 구도">아이레벨 — 피사체와 눈높이 정면</option>
              <option value="낮은 앵글에서 올려다보는 구도">로우앵글 — 아래서 올려다보기</option>
              <option value="피사체를 한쪽으로 치우친 3분할 구도">3분할 — 피사체를 한쪽 치우침</option>
              <option value="피사체를 중앙에 대칭으로 배치한 구도">센터 대칭 — 정중앙 배치</option>
              <option value="배경을 흐리게 날린 아웃포커싱 구도">아웃포커싱 — 배경 흐림 강조</option>
              <option value="창문·문틀·손 등 프레임 안에 피사체를 담은 구도">프레임 인 프레임 — 창문·틀 활용</option>
              <option value="피사체를 대각선 방향으로 배치한 구도">대각선 구도 — 역동적 사선 배치</option>
              <option value="넓은 공간을 담은 광각 환경 사진 구도">광각 환경샷 — 공간 전체 담기</option>
              <option value="피사체에 매우 가깝게 접근한 클로즈업 구도">클로즈업 — 디테일 극대화</option>
            </select>
          </div>
          <div class="ib-field">
            <label class="ib-label" for="igDetails">추가 디테일</label>
            <input type="text" id="igDetails" class="ib-input" placeholder="예) 테이블 위 빛 반사, 따뜻한 색감" />
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

  const igApiKey        = document.getElementById('igApiKey');
  const igConnectBtn    = document.getElementById('igConnectBtn');
  const igApiError      = document.getElementById('igApiError');
  const igApiOk         = document.getElementById('igApiOk');
  const igGenerateBtn   = document.getElementById('igGenerateBtn');
  const igFreeGenerateBtn = document.getElementById('igFreeGenerateBtn');
  const igLoading       = document.getElementById('igLoading');
  const igError         = document.getElementById('igError');
  const igResultCard    = document.getElementById('igResultCard');
  const igResultImg     = document.getElementById('igResultImg');
  const igRegenerateBtn = document.getElementById('igRegenerateBtn');
  const igDownloadBtn   = document.getElementById('igDownloadBtn');

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

  function setGenerating(on) {
    igGenerateBtn.disabled     = on;
    igFreeGenerateBtn.disabled = on;
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
      situation:   document.getElementById('igSituation').value.trim(),
      timeWeather: document.getElementById('igTimeWeather').value.trim(),
      composition: document.getElementById('igComposition').value,
      details:     document.getElementById('igDetails').value.trim(),
      size:        getSize(),
    });
  }

  async function generateFree() {
    if (!apiKey) { showApiError('먼저 OpenAI API 키를 연동해주세요.'); return; }
    const rawPrompt = document.getElementById('igFreePrompt').value.trim();
    if (!rawPrompt) { igError.textContent = '프롬프트를 입력해주세요.'; igError.classList.remove('hidden'); return; }
    lastGenFn = generateFree;
    await runGenerate({ rawPrompt, size: getFreeSize() });
  }

  igGenerateBtn.addEventListener('click', generate);
  igFreeGenerateBtn.addEventListener('click', generateFree);
  igRegenerateBtn.addEventListener('click', () => lastGenFn?.());
}
