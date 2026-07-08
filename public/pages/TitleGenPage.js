import { copyText } from '../utils.js';

export function getHTML() {
  return `
  <div class="title-gen-page">
    <div class="title-gen-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="title-gen-hero-inner">
        <div class="hero-badge">AI 도구</div>
        <h1 class="title-gen-heading">따로 생성</h1>
        <p class="title-gen-sub">제목, 해시태그, 섹션 보완, 사진 설명, 정보 검색까지</p>
      </div>
    </div>

    <!-- 섹션 내비게이션 -->
    <nav class="tg-section-nav" id="tgSectionNav">
      <a class="tg-sec-link active" data-target="sec-title">제목 생성</a>
      <a class="tg-sec-link" data-target="sec-hashtag">해시태그 생성</a>
      <a class="tg-sec-link" data-target="sec-improve">섹션 보완</a>
      <a class="tg-sec-link" data-target="sec-photo">사진 설명</a>
      <a class="tg-sec-link" data-target="sec-research">정보 검색</a>
    </nav>

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

      <!-- ① 제목 생성 -->
      <section class="card tg-card" id="sec-title">
        <div class="tg-card-header">
          <h2 class="tg-card-title">제목 생성</h2>
          <p class="tg-card-desc">본문을 붙여넣으면 네이버 SEO에 최적화된 제목을 만들어드려요</p>
        </div>
        <div class="tg-naver-row">
          <label class="tg-naver-label" for="tgNaverQuery">네이버 검색 키워드 <span class="tag-optional">선택</span></label>
          <p class="tg-naver-hint">입력하면 실제 상위 노출 제목을 참고해서 만들어요 (예: 성수동 카페)</p>
          <input type="text" id="tgNaverQuery" class="tg-naver-input" placeholder="예) 성수동 카페, 홍대 맛집" />
        </div>
        <textarea id="tgBodyInput" class="tg-body-textarea" placeholder="블로그 본문을 여기에 붙여넣으세요..." rows="8"></textarea>
        <div class="tg-char-count"><span id="tgCharCount">0</span>자</div>
        <button class="btn-tg-generate" id="tgGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
          제목 생성하기
        </button>
        <div class="tg-loading hidden" id="tgLoading"><div class="spinner"></div><span>제목 생성 중...</span></div>
        <p class="tg-error hidden" id="tgError"></p>
        <div class="tg-result-card hidden" id="tgResultCard">
          <div class="tg-result-header">
            <h2 class="tg-result-title">생성된 제목</h2>
            <button class="btn-copy" id="tgCopyBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              복사
            </button>
          </div>
          <div class="tg-result-box" id="tgResultBox" contenteditable="true" spellcheck="false"></div>
          <p class="tg-result-hint">클릭해서 직접 수정할 수 있어요</p>
        </div>
      </section>

      <!-- ② 해시태그 생성 -->
      <section class="card tg-card" id="sec-hashtag">
        <div class="tg-card-header">
          <h2 class="tg-card-title">해시태그 생성</h2>
          <p class="tg-card-desc">본문을 붙여넣으면 네이버에 최적화된 해시태그 20개를 만들어드려요</p>
        </div>
        <div class="tg-naver-row">
          <label class="tg-naver-label" for="htNaverQuery">네이버 검색 키워드 <span class="tag-optional">선택</span></label>
          <p class="tg-naver-hint">지역/카테고리 입력 시 실제로 쓰이는 키워드를 참고해요 (예: 성수동 카페)</p>
          <input type="text" id="htNaverQuery" class="tg-naver-input" placeholder="예) 성수동 카페, 홍대 맛집" />
        </div>
        <textarea id="htBodyInput" class="tg-body-textarea" placeholder="블로그 본문을 여기에 붙여넣으세요..." rows="8"></textarea>
        <div class="tg-char-count"><span id="htCharCount">0</span>자</div>
        <button class="btn-tg-generate" id="htGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
          해시태그 생성하기
        </button>
        <div class="tg-loading hidden" id="htLoading"><div class="spinner"></div><span>해시태그 생성 중...</span></div>
        <p class="tg-error hidden" id="htError"></p>
        <div class="tg-result-card hidden" id="htResultCard">
          <div class="tg-result-header">
            <h2 class="tg-result-title">생성된 해시태그</h2>
            <button class="btn-copy" id="htCopyBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              복사
            </button>
          </div>
          <div class="tg-result-box" id="htResultBox" contenteditable="true" spellcheck="false"></div>
          <p class="tg-result-hint">클릭해서 직접 수정할 수 있어요</p>
        </div>
      </section>

      <!-- ③ 섹션 보완 -->
      <section class="card tg-card" id="sec-improve">
        <div class="tg-card-header">
          <h2 class="tg-card-title">섹션 보완</h2>
          <p class="tg-card-desc">기존 본문과 보완이 필요한 내용을 입력하면 해당 섹션만 새로 작성해드려요</p>
        </div>
        <textarea id="impBodyInput" class="tg-body-textarea" placeholder="기존 블로그 본문을 붙여넣으세요..." rows="8"></textarea>
        <div class="tg-char-count"><span id="impCharCount">0</span>자</div>
        <div class="tg-naver-row" style="margin-top:16px">
          <label class="tg-naver-label" for="impInstruction">보완 요청</label>
          <p class="tg-naver-hint">어떤 섹션을 어떻게 바꾸고 싶은지 적어주세요 (예: 주차 설명이 너무 짧아요, 카페 분위기 섹션을 더 자세히 써줘)</p>
          <textarea id="impInstruction" class="tg-naver-input" rows="3" placeholder="예) 디저트 섹션이 없는데 딸기 케이크 내용을 추가해줘"></textarea>
        </div>
        <button class="btn-tg-generate" id="impGenerateBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
          섹션 보완하기
        </button>
        <div class="tg-loading hidden" id="impLoading"><div class="spinner"></div><span>보완 중...</span></div>
        <p class="tg-error hidden" id="impError"></p>
        <div class="tg-result-card hidden" id="impResultCard">
          <div class="tg-result-header">
            <h2 class="tg-result-title">보완된 섹션</h2>
            <button class="btn-copy" id="impCopyBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              복사
            </button>
          </div>
          <div class="tg-result-box" id="impResultBox" contenteditable="true" spellcheck="false"></div>
          <p class="tg-result-hint">클릭해서 직접 수정할 수 있어요</p>
        </div>
      </section>

      <!-- ④ 사진 설명 생성 -->
      <section class="card tg-card" id="sec-photo">
        <div class="tg-card-header">
          <h2 class="tg-card-title">사진 설명 생성</h2>
          <p class="tg-card-desc">사진 한 장을 올리면 블로그에 바로 쓸 수 있는 설명을 작성해드려요</p>
        </div>
        <div class="photo-desc-upload" id="photoDescUpload">
          <input type="file" id="photoDescInput" accept="image/*" class="hidden" />
          <div class="photo-desc-drop" id="photoDescDrop">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:40px;height:40px;color:#9ca3af">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <p>클릭하거나 사진을 드래그해서 올려주세요</p>
          </div>
          <img id="photoDescPreview" class="hidden" style="max-width:100%;max-height:300px;border-radius:12px;margin-top:12px;object-fit:contain" />
        </div>
        <button class="btn-tg-generate" id="photoDescBtn" style="margin-top:16px">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
          설명 생성하기
        </button>
        <div class="tg-loading hidden" id="photoDescLoading"><div class="spinner"></div><span>사진 분석 중...</span></div>
        <p class="tg-error hidden" id="photoDescError"></p>
        <div class="tg-result-card hidden" id="photoDescResultCard">
          <div class="tg-result-header">
            <h2 class="tg-result-title">생성된 설명</h2>
            <button class="btn-copy" id="photoDescCopyBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              복사
            </button>
          </div>
          <div class="tg-result-box" id="photoDescResultBox" contenteditable="true" spellcheck="false"></div>
          <p class="tg-result-hint">클릭해서 직접 수정할 수 있어요</p>
        </div>
      </section>

      <!-- ⑤ 정보 검색 & 블로그 작성 -->
      <section class="card tg-card" id="sec-research">
        <div class="tg-card-header">
          <h2 class="tg-card-title">정보 검색 & 블로그 작성</h2>
          <p class="tg-card-desc">블로그에 넣고 싶은 정보를 적으면 AI가 검색해서 블로그용으로 작성해드려요</p>
        </div>
        <div class="tg-naver-row">
          <label class="tg-naver-label" for="researchTopic">검색할 내용</label>
          <p class="tg-naver-hint">예) 가평 신비동물원 입장료 및 운영시간, 성수동 카페 주차 정보</p>
          <textarea id="researchTopic" class="tg-naver-input" rows="4" placeholder="블로그에 넣고 싶은 정보를 자유롭게 적어주세요..."></textarea>
        </div>
        <button class="btn-tg-generate" id="researchBtn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
          검색 후 작성하기
        </button>
        <div class="tg-loading hidden" id="researchLoading"><div class="spinner"></div><span>검색 및 작성 중...</span></div>
        <p class="tg-error hidden" id="researchError"></p>
        <div class="tg-result-card hidden" id="researchResultCard">
          <div class="tg-result-header">
            <h2 class="tg-result-title">작성된 내용</h2>
            <button class="btn-copy" id="researchCopyBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              복사
            </button>
          </div>
          <div class="tg-result-box" id="researchResultBox" contenteditable="true" spellcheck="false"></div>
          <p class="tg-result-hint">클릭해서 직접 수정할 수 있어요</p>
        </div>
      </section>

    </div>
  </div>
  `;
}

export function mount() {
  const apiKey = sessionStorage.getItem('gemini_key');
  const openaiKey = sessionStorage.getItem('openai_key') || '';

  const tgApiConnected = document.getElementById('tgApiConnected');
  const tgApiMissing = document.getElementById('tgApiMissing');
  const tgMaskedKey = document.getElementById('tgMaskedKey');

  if (apiKey) {
    tgApiConnected.classList.remove('hidden');
    tgMaskedKey.textContent = apiKey.slice(0, 8) + '••••••••••••••••••••' + apiKey.slice(-4);
  } else {
    tgApiMissing.classList.remove('hidden');
  }

  /* ── 섹션 내비게이션 ── */
  document.querySelectorAll('.tg-sec-link').forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.tg-sec-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  /* ── 공통 헬퍼 ── */
  function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
  function makeHandler({ inputEl, countEl, generateBtn, loadingEl, errorEl, resultCard, resultBox, copyBtn, endpoint, buildFormData, buildBody }) {
    if (countEl && inputEl) {
      inputEl.addEventListener('input', () => { countEl.textContent = inputEl.value.length.toLocaleString(); });
    }
    generateBtn.addEventListener('click', async () => {
      if (!apiKey) { showError(errorEl, 'API 키가 없어요. 홈에서 먼저 연동해주세요.'); return; }
      errorEl.classList.add('hidden');
      resultCard.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      generateBtn.disabled = true;
      try {
        const headers = { 'x-api-key': apiKey };
        if (openaiKey) headers['x-openai-key'] = openaiKey;
        let res;
        if (buildFormData) {
          res = await fetch(endpoint, { method: 'POST', headers, body: buildFormData() });
        } else {
          headers['Content-Type'] = 'application/json';
          res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(buildBody()) });
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '생성에 실패했어요.');
        resultBox.textContent = data.result ?? data.title ?? data.hashtags ?? data.description ?? '';
        resultCard.classList.remove('hidden');
      } catch (err) {
        showError(errorEl, err.message);
      } finally {
        loadingEl.classList.add('hidden');
        generateBtn.disabled = false;
      }
    });
    copyBtn.addEventListener('click', () => copyText(resultBox.textContent, '내용'));
  }

  /* ── ① 제목 생성 ── */
  const tgBodyInput = document.getElementById('tgBodyInput');
  makeHandler({
    inputEl: tgBodyInput, countEl: document.getElementById('tgCharCount'),
    generateBtn: document.getElementById('tgGenerateBtn'),
    loadingEl: document.getElementById('tgLoading'), errorEl: document.getElementById('tgError'),
    resultCard: document.getElementById('tgResultCard'), resultBox: document.getElementById('tgResultBox'),
    copyBtn: document.getElementById('tgCopyBtn'),
    endpoint: '/api/generate-title',
    buildBody: () => {
      const body = tgBodyInput.value.trim();
      if (!body) throw new Error('본문을 입력해주세요.');
      const naverQuery = document.getElementById('tgNaverQuery').value.trim();
      return { body, ...(naverQuery && { naverQuery }) };
    },
  });

  /* ── ② 해시태그 생성 ── */
  const htBodyInput = document.getElementById('htBodyInput');
  makeHandler({
    inputEl: htBodyInput, countEl: document.getElementById('htCharCount'),
    generateBtn: document.getElementById('htGenerateBtn'),
    loadingEl: document.getElementById('htLoading'), errorEl: document.getElementById('htError'),
    resultCard: document.getElementById('htResultCard'), resultBox: document.getElementById('htResultBox'),
    copyBtn: document.getElementById('htCopyBtn'),
    endpoint: '/api/generate-hashtags',
    buildBody: () => {
      const body = htBodyInput.value.trim();
      if (!body) throw new Error('본문을 입력해주세요.');
      const naverQuery = document.getElementById('htNaverQuery').value.trim();
      return { body, ...(naverQuery && { naverQuery }) };
    },
  });

  /* ── ③ 섹션 보완 ── */
  const impBodyInput = document.getElementById('impBodyInput');
  makeHandler({
    inputEl: impBodyInput, countEl: document.getElementById('impCharCount'),
    generateBtn: document.getElementById('impGenerateBtn'),
    loadingEl: document.getElementById('impLoading'), errorEl: document.getElementById('impError'),
    resultCard: document.getElementById('impResultCard'), resultBox: document.getElementById('impResultBox'),
    copyBtn: document.getElementById('impCopyBtn'),
    endpoint: '/api/improve-section',
    buildBody: () => {
      const body = impBodyInput.value.trim();
      const instruction = document.getElementById('impInstruction').value.trim();
      if (!body) throw new Error('기존 본문을 입력해주세요.');
      if (!instruction) throw new Error('보완할 내용을 입력해주세요.');
      return { body, instruction };
    },
  });

  /* ── ④ 사진 설명 생성 ── */
  const photoInput = document.getElementById('photoDescInput');
  const photoDrop = document.getElementById('photoDescDrop');
  const photoPreview = document.getElementById('photoDescPreview');
  const photoDescBtn = document.getElementById('photoDescBtn');
  const photoDescLoading = document.getElementById('photoDescLoading');
  const photoDescError = document.getElementById('photoDescError');
  const photoDescResultCard = document.getElementById('photoDescResultCard');
  const photoDescResultBox = document.getElementById('photoDescResultBox');
  const photoDescCopyBtn = document.getElementById('photoDescCopyBtn');
  let selectedPhotoFile = null;

  photoDrop.addEventListener('click', () => photoInput.click());
  photoDrop.addEventListener('dragover', e => { e.preventDefault(); photoDrop.classList.add('dragover'); });
  photoDrop.addEventListener('dragleave', () => photoDrop.classList.remove('dragover'));
  photoDrop.addEventListener('drop', e => {
    e.preventDefault(); photoDrop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) setPhotoFile(file);
  });
  photoInput.addEventListener('change', () => { if (photoInput.files[0]) setPhotoFile(photoInput.files[0]); });

  function setPhotoFile(file) {
    selectedPhotoFile = file;
    const url = URL.createObjectURL(file);
    photoPreview.src = url;
    photoPreview.classList.remove('hidden');
    photoDrop.style.display = 'none';
  }

  photoDescBtn.addEventListener('click', async () => {
    if (!apiKey) { showError(photoDescError, 'API 키가 없어요. 홈에서 먼저 연동해주세요.'); return; }
    if (!selectedPhotoFile) { showError(photoDescError, '사진을 먼저 올려주세요.'); return; }
    photoDescError.classList.add('hidden');
    photoDescResultCard.classList.add('hidden');
    photoDescLoading.classList.remove('hidden');
    photoDescBtn.disabled = true;
    try {
      const fd = new FormData();
      fd.append('photo', selectedPhotoFile);
      const headers = { 'x-api-key': apiKey };
      if (openaiKey) headers['x-openai-key'] = openaiKey;
      const res = await fetch('/api/describe-photo', { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '설명 생성에 실패했어요.');
      photoDescResultBox.textContent = data.description;
      photoDescResultCard.classList.remove('hidden');
    } catch (err) {
      showError(photoDescError, err.message);
    } finally {
      photoDescLoading.classList.add('hidden');
      photoDescBtn.disabled = false;
    }
  });
  photoDescCopyBtn.addEventListener('click', () => copyText(photoDescResultBox.textContent, '설명'));

  /* ── ⑤ 정보 검색 & 블로그 작성 ── */
  makeHandler({
    generateBtn: document.getElementById('researchBtn'),
    loadingEl: document.getElementById('researchLoading'), errorEl: document.getElementById('researchError'),
    resultCard: document.getElementById('researchResultCard'), resultBox: document.getElementById('researchResultBox'),
    copyBtn: document.getElementById('researchCopyBtn'),
    endpoint: '/api/research-blog',
    buildBody: () => {
      const topic = document.getElementById('researchTopic').value.trim();
      if (!topic) throw new Error('검색할 내용을 입력해주세요.');
      return { topic };
    },
  });

  /* ── 스크롤 감지 → 내비 활성화 ── */
  const sections = ['sec-title', 'sec-hashtag', 'sec-improve', 'sec-photo', 'sec-research'];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.tg-sec-link').forEach(l => {
          l.classList.toggle('active', l.dataset.target === entry.target.id);
        });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('customModal');
      if (overlay && !overlay.classList.contains('hidden') && !overlay.dataset.confirm) overlay.classList.add('hidden');
    }
  };
  document.addEventListener('keydown', handleKeydown);
  return function unmount() {
    document.removeEventListener('keydown', handleKeydown);
    observer.disconnect();
  };
}
