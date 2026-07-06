import { showAlert, showConfirm, copyText } from '../utils.js';

export function getHTML() {
  return `
  <!-- 스티키 헤더 -->
  <div class="sticky-header" id="stickyHeader">
    <div class="sticky-header-inner">
      <div class="sticky-logo">
        <img src="/favicon.png" alt="찍기만 해!" class="sticky-logo-img" />
        <span class="sticky-logo-text">찍기만 해!</span>
      </div>
      <div class="sticky-actions">
        <span class="sticky-badge">AI 블로그 생성</span>
        <button class="sticky-start-btn" id="stickyStartBtn">시작하기</button>
      </div>
    </div>
  </div>

  <!-- 히어로 섹션 -->
  <section class="hero-section" id="heroSection">
    <div class="hero-orb hero-orb-1"></div>
    <div class="hero-orb hero-orb-2"></div>
    <div class="hero-inner">
      <div class="hero-left">
        <div class="hero-badge">AI 블로그 자동 생성</div>
        <h1 class="hero-title">찍기만 해!<br><span class="hero-title-gradient">글은 AI가</span></h1>
        <p class="hero-sub">사진 한 장으로 완성되는 네이버 블로그</p>
      </div>
    </div>
  </section>

  <div class="app-wrapper">
    <header class="app-header">
      <div class="logo">
        <span class="logo-accent">찍기만 해!</span>
        <p>사진만 올리면 네이버 블로그 글이 완성돼요</p>
      </div>
    </header>

    <main class="main-content">

      <!-- API 연동 카드 -->
      <section class="card api-card" id="apiCard">
        <div class="api-card-header">
          <span class="api-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
            </svg>
          </span>
          <div class="api-card-texts">
            <h2>Google Gemini API 연동</h2>
            <p id="apiCardDesc">API 키를 입력하고 연동하면 블로그 글 생성이 시작됩니다</p>
          </div>
          <span class="api-badge hidden" id="apiBadge">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            연동됨
          </span>
        </div>
        <div class="api-input-row" id="apiInputRow">
          <div class="api-input-group">
            <input type="text" name="username" value="Gemini API Key" autocomplete="username" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" />
            <input type="password" id="apiKey" name="password" placeholder="AIzaSy..." autocomplete="current-password" />
            <button class="btn-icon" id="toggleKey" title="보기/숨기기">
              <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
          <button class="btn-connect" id="connectBtn">연동하기</button>
        </div>
        <div class="api-connected-row hidden" id="apiConnectedRow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="connected-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="masked-key" id="maskedKey"></span>
          <button class="btn-change-key" id="changeKeyBtn">키 변경</button>
        </div>
        <p class="api-error hidden" id="apiError"></p>
      </section>

      <!-- 메인 폼 -->
      <div class="main-steps locked" id="mainSteps">

        <!-- Step 1 -->
        <section class="card step-card">
          <div class="step-label">STEP 1</div>
          <h2 class="step-title">카테고리 · 장소 정보</h2>
          <div class="category-tabs">
            <button class="cat-tab active" data-cat="cafe">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
              <span>카페</span>
            </button>
            <button class="cat-tab" data-cat="restaurant">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>
              <span>음식점</span>
            </button>
            <button class="cat-tab" data-cat="accommodation">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              <span>숙소</span>
            </button>
            <button class="cat-tab" data-cat="etc">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              <span>기타</span>
            </button>
          </div>

          <div class="section-divider"><span>장소 정보</span></div>

          <div class="info-fetch-section">
            <p class="field-label">장소 정보 자동 입력 <span class="tag-optional">선택</span></p>
            <p class="field-hint">네이버 지도 캡처, 메뉴판 등 장소 정보가 담긴 사진을 올리면 자동으로 채워드려요</p>
            <div class="info-methods">
              <div class="info-upload-zone" id="infoUploadZone">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                <span class="info-method-title">파일 선택</span>
                <span class="info-method-sub">클릭하거나 드래그</span>
                <input type="file" id="infoPhotoInput" accept="image/*" hidden />
              </div>
              <button class="info-paste-zone" id="pasteClipboardBtn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
                <span class="info-method-title">캡처 붙여넣기</span>
                <span class="info-method-sub">스크린샷 후 클릭</span>
              </button>
            </div>
            <div class="info-preview-wrap hidden" id="infoPreviewWrap">
              <img class="info-preview-img" id="infoPreviewImg" src="" alt="정보 사진" />
              <div class="info-extract-status">
                <div class="extract-spinner hidden" id="extractSpinner"></div>
                <span id="infoExtractText">AI 분석 중...</span>
              </div>
              <button class="btn-clear-info" id="clearInfoPhoto" title="제거">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div class="section-divider"><span>직접 입력</span></div>

          <div class="field-group" id="fields-cafe">
            <div class="field-row">
              <div class="field"><label>카페명 <span class="req">*</span></label><input type="text" name="name" placeholder="예) 온더테이블 성수점" /></div>
              <div class="field"><label>위치 <span class="req">*</span></label><input type="text" name="location" placeholder="예) 서울 성동구 성수동" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>영업시간</label><input type="text" name="hours" placeholder="예) 평일 10:00~22:00" /></div>
              <div class="field"><label>편의시설</label><input type="text" name="amenities" placeholder="예) 와이파이, 콘센트, 테라스" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>주차 여부</label>
                <div class="radio-group">
                  <label class="radio-label"><input type="radio" name="parking" value="주차 가능" checked /> 가능</label>
                  <label class="radio-label"><input type="radio" name="parking" value="주차 불가" /> 불가</label>
                  <label class="radio-label"><input type="radio" name="parking" value="인근 유료주차" /> 인근 유료</label>
                </div>
              </div>
            </div>
          </div>

          <div class="field-group hidden" id="fields-restaurant">
            <div class="field-row">
              <div class="field"><label>식당명 <span class="req">*</span></label><input type="text" name="name" placeholder="예) 을지로 원조집" /></div>
              <div class="field"><label>위치 <span class="req">*</span></label><input type="text" name="location" placeholder="예) 서울 중구 을지로" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>대표메뉴 및 가격</label><input type="text" name="menu" placeholder="예) 갈비탕 15,000원" /></div>
              <div class="field"><label>영업시간</label><input type="text" name="hours" placeholder="예) 11:30~21:00" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>예약 필요 여부</label>
                <div class="radio-group">
                  <label class="radio-label"><input type="radio" name="reservation" value="예약 필수" /> 예약 필수</label>
                  <label class="radio-label"><input type="radio" name="reservation" value="예약 가능" checked /> 예약 가능</label>
                  <label class="radio-label"><input type="radio" name="reservation" value="예약 불필요" /> 불필요</label>
                </div>
              </div>
              <div class="field"><label>주차 여부</label>
                <div class="radio-group">
                  <label class="radio-label"><input type="radio" name="parking" value="주차 가능" checked /> 가능</label>
                  <label class="radio-label"><input type="radio" name="parking" value="주차 불가" /> 불가</label>
                  <label class="radio-label"><input type="radio" name="parking" value="인근 유료주차" /> 인근 유료</label>
                </div>
              </div>
            </div>
          </div>

          <div class="field-group hidden" id="fields-accommodation">
            <div class="field-row">
              <div class="field"><label>숙소명 <span class="req">*</span></label><input type="text" name="name" placeholder="예) 제주 오션뷰 풀빌라" /></div>
              <div class="field"><label>위치 <span class="req">*</span></label><input type="text" name="location" placeholder="예) 제주 서귀포시 중문동" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>1박 가격</label><input type="text" name="price" placeholder="예) 주중 180,000원" /></div>
              <div class="field"><label>전화번호</label><input type="text" name="phone" placeholder="예) 064-000-0000" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>체크인</label><input type="text" name="checkin" placeholder="예) 15:00" /></div>
              <div class="field"><label>체크아웃</label><input type="text" name="checkout" placeholder="예) 11:00" /></div>
            </div>
            <div class="field-row">
              <div class="field field-full"><label>예약 링크 <span class="tag-optional">선택</span></label><input type="text" name="affiliateLink" placeholder="예) https://booking.com/... — AI가 글 안에 자연스럽게 넣어드려요" /></div>
            </div>
          </div>

          <div class="field-group hidden" id="fields-etc">
            <div class="field-row">
              <div class="field"><label>장소 이름 <span class="req">*</span></label><input type="text" name="name" placeholder="예) 서울숲" /></div>
              <div class="field"><label>위치 <span class="req">*</span></label><input type="text" name="location" placeholder="예) 서울 성동구 뚝섬로" /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>영업시간</label><input type="text" name="hours" placeholder="예) 상시 개방" /></div>
              <div class="field"><label>주차 여부</label>
                <div class="radio-group">
                  <label class="radio-label"><input type="radio" name="parking" value="주차 가능" checked /> 가능</label>
                  <label class="radio-label"><input type="radio" name="parking" value="주차 불가" /> 불가</label>
                  <label class="radio-label"><input type="radio" name="parking" value="인근 유료주차" /> 인근 유료</label>
                </div>
              </div>
            </div>
            <div class="field-row">
              <div class="field field-full"><label>넣고 싶은 정보</label><input type="text" name="extra" placeholder="예) 입장료 무료, 반려동물 동반 가능" /></div>
            </div>
          </div>

          <div class="rating-section">
            <label class="field-label">별점 <span class="req">*</span></label>
            <div class="star-picker">
              <div class="stars-row" id="starsDisplay">
                <div class="star-unit" data-unit="1"><div class="star-bg">★</div><div class="star-fill" id="sf1"></div><div class="zone zone-l" data-val="0.5"></div><div class="zone zone-r" data-val="1"></div></div>
                <div class="star-unit" data-unit="2"><div class="star-bg">★</div><div class="star-fill" id="sf2"></div><div class="zone zone-l" data-val="1.5"></div><div class="zone zone-r" data-val="2"></div></div>
                <div class="star-unit" data-unit="3"><div class="star-bg">★</div><div class="star-fill" id="sf3"></div><div class="zone zone-l" data-val="2.5"></div><div class="zone zone-r" data-val="3"></div></div>
                <div class="star-unit" data-unit="4"><div class="star-bg">★</div><div class="star-fill" id="sf4"></div><div class="zone zone-l" data-val="3.5"></div><div class="zone zone-r" data-val="4"></div></div>
                <div class="star-unit" data-unit="5"><div class="star-bg">★</div><div class="star-fill" id="sf5"></div><div class="zone zone-l" data-val="4.5"></div><div class="zone zone-r" data-val="5"></div></div>
              </div>
              <span class="rating-value" id="ratingValue">4.5 / 5</span>
            </div>
          </div>
        </section>

        <!-- Step 2 -->
        <section class="card step-card">
          <div class="step-label">STEP 2</div>
          <h2 class="step-title">꼭 넣고 싶은 내용</h2>
          <p class="step-desc">블로그 글에 반드시 포함됐으면 하는 내용을 자유롭게 적어주세요 <span class="tag-optional">선택</span></p>
          <textarea id="memoInput" class="memo-textarea" placeholder="예) 직원분이 너무 친절하셨어요 / 창가 자리 꼭 앉아보세요 / 웨이팅 있었는데 30분 정도 기다렸어요..." rows="5"></textarea>
        </section>

        <!-- Step 3 -->
        <section class="card step-card step-card-photos">
          <div class="step-label">STEP 3</div>
          <h2 class="step-title">리뷰 사진 업로드</h2>
          <p class="step-desc">목차별로 사진을 올려주세요 · JPG, PNG, WEBP · 장당 10MB</p>
          <div id="sectionsContainer" class="sections-container"></div>
          <button class="btn-add-section" id="addSectionBtn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            목차 추가
          </button>
        </section>

        <!-- Generate -->
        <div class="generate-section">
          <button class="btn-generate" id="generateBtn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            블로그 글 자동 생성
          </button>
        </div>

        <!-- Progress -->
        <div class="progress-card hidden" id="progressCard">
          <div class="progress-inner">
            <div class="spinner"></div>
            <div class="progress-text">
              <p class="progress-status" id="progressStatus">준비 중...</p>
              <div class="progress-bar-wrap"><div class="progress-bar" id="progressBar"></div></div>
              <p class="progress-detail" id="progressDetail"></p>
            </div>
          </div>
        </div>

        <!-- Result -->
        <section class="card result-card hidden" id="resultCard">
          <div class="ai-notice">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
            <p>AI가 사진을 분석해 작성한 글이에요. 장소명·메뉴·가격·영업시간 등 세부 내용이 실제와 다를 수 있으니, 올리기 전에 꼭 확인하고 수정해주세요.</p>
          </div>
          <div class="result-header">
            <h2>완성된 블로그 글</h2>
            <div class="result-actions">
              <button class="btn-copy" id="copyTitle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                제목 복사
              </button>
              <button class="btn-copy" id="copyBody">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.688a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                본문 복사
              </button>
              <button class="btn-copy btn-copy-all" id="copyAll">전체 복사</button>
            </div>
          </div>
          <div class="result-section">
            <div class="result-label-row"><span class="result-label">제목</span><span class="result-hint">네이버 블로그 제목으로 사용</span></div>
            <div class="result-title-box" id="titleOutput" contenteditable="true" spellcheck="false"></div>
          </div>
          <div class="result-section">
            <div class="result-label-row"><span class="result-label">본문</span><span class="result-hint">사진은 미리보기로 표시 · 복사하면 [사진N] 위치 마커가 포함돼요</span></div>
            <div class="result-body-box" id="bodyOutput" contenteditable="true" spellcheck="false"></div>
          </div>
          <div class="result-section">
            <div class="result-label-row"><span class="result-label">해시태그</span><span class="result-hint">각 태그를 클릭하면 복사돼요</span></div>
            <div class="result-tags-box" id="tagsOutput"></div>
          </div>
        </section>

      </div><!-- /main-steps -->
    </main>

    <footer class="app-footer">
      <p>Powered by Google Gemini · 네이버 블로그 최적화</p>
    </footer>
  </div>
  `;
}

export function mount() {
  /* ── State ── */
  let selectedCategory = 'cafe';
  let selectedRating = 4.5;
  let sections = [];
  let connectedApiKey = '';
  let rawBodyText = '';
  let dragSrcIndex = null;
  let dragSrcSection = null;
  let lightboxObjectUrl = null;
  const thumbnailCache = new Map();

  const CATEGORY_SECTIONS = {
    cafe:          ['외관 및 주차 정보', '메뉴', '내부 인테리어 & 분위기', '메뉴 리뷰', '총평'],
    restaurant:    ['가게 위치 및 외관', '메뉴판 및 주문 메뉴', '매장 내부 및 편의시설', '솔직 후기'],
    accommodation: ['위치 및 체크인/로비', '객실 내부', '부대시설', '총평'],
    etc:           [],
  };

  /* ── DOM ── */
  const apiCard         = document.getElementById('apiCard');
  const apiCardDesc     = document.getElementById('apiCardDesc');
  const apiBadge        = document.getElementById('apiBadge');
  const apiKeyInput     = document.getElementById('apiKey');
  const toggleKeyBtn    = document.getElementById('toggleKey');
  const connectBtn      = document.getElementById('connectBtn');
  const apiInputRow     = document.getElementById('apiInputRow');
  const apiConnectedRow = document.getElementById('apiConnectedRow');
  const maskedKey       = document.getElementById('maskedKey');
  const changeKeyBtn    = document.getElementById('changeKeyBtn');
  const apiError        = document.getElementById('apiError');
  const mainSteps       = document.getElementById('mainSteps');
  const stickyHeader    = document.getElementById('stickyHeader');
  const heroSection     = document.getElementById('heroSection');

  /* ── 썸네일 ── */
  function initSections(category) {
    sections.forEach(s => s.photos.forEach(f => {
      const u = thumbnailCache.get(f);
      if (u) { URL.revokeObjectURL(u); thumbnailCache.delete(f); }
    }));
    sections = (CATEGORY_SECTIONS[category] || []).map(name => ({ name, photos: [], fixed: true }));
  }

  function getThumbnailUrl(file) {
    if (thumbnailCache.has(file)) return Promise.resolve(thumbnailCache.get(file));
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const maxDim = 300;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          thumbnailCache.set(file, url);
          resolve(url);
        }, 'image/jpeg', 0.75);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        const fallback = URL.createObjectURL(file);
        thumbnailCache.set(file, fallback);
        resolve(fallback);
      };
      img.src = objUrl;
    });
  }

  /* ── API 키 ── */
  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    const svg = toggleKeyBtn.querySelector('svg');
    if (isPassword) {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />`;
    } else {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />`;
    }
  });

  apiKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connectBtn.click(); });

  connectBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) { showApiError('API 키를 입력해주세요.'); return; }
    connectBtn.disabled = true;
    connectBtn.textContent = '연동 중...';
    hideApiError();
    try {
      const resp = await fetch('/api/verify-key', { method: 'POST', headers: { 'x-api-key': key } });
      if (resp.ok) {
        setConnected(key);
      } else {
        const body = await resp.json().catch(() => ({ error: `오류 ${resp.status}` }));
        showApiError(body.error || '연동에 실패했어요.');
        connectBtn.disabled = false;
        connectBtn.textContent = '연동하기';
      }
    } catch {
      showApiError('서버에 연결할 수 없어요. 서버가 실행 중인지 확인해주세요.');
      connectBtn.disabled = false;
      connectBtn.textContent = '연동하기';
    }
  });

  changeKeyBtn.addEventListener('click', () => setDisconnected());

  function setConnected(key) {
    connectedApiKey = key;
    sessionStorage.setItem('gemini_key', key);
    apiCard.classList.add('connected');
    apiBadge.classList.remove('hidden');
    apiInputRow.classList.add('hidden');
    apiConnectedRow.classList.remove('hidden');
    maskedKey.textContent = key.substring(0, 8) + '••••••••' + key.slice(-4);
    apiCardDesc.textContent = '연동 완료! 아래에서 블로그 글을 생성해보세요';
    mainSteps.classList.remove('locked');
    connectBtn.disabled = false;
    connectBtn.textContent = '연동하기';
    hideApiError();
  }

  function setDisconnected() {
    connectedApiKey = '';
    sessionStorage.removeItem('gemini_key');
    apiCard.classList.remove('connected');
    apiBadge.classList.add('hidden');
    apiInputRow.classList.remove('hidden');
    apiConnectedRow.classList.add('hidden');
    apiCardDesc.textContent = 'API 키를 입력하고 연동하면 블로그 글 생성이 시작됩니다';
    apiKeyInput.value = '';
    mainSteps.classList.add('locked');
  }

  function showApiError(msg) { apiError.textContent = msg; apiError.classList.remove('hidden'); }
  function hideApiError() { apiError.classList.add('hidden'); }

  /* ── 카테고리 ── */
  const catTabs = document.querySelectorAll('.cat-tab');
  const fieldGroups = {
    cafe:          document.getElementById('fields-cafe'),
    restaurant:    document.getElementById('fields-restaurant'),
    accommodation: document.getElementById('fields-accommodation'),
    etc:           document.getElementById('fields-etc'),
  };

  catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedCategory = tab.dataset.cat;
      Object.entries(fieldGroups).forEach(([cat, el]) =>
        el.classList.toggle('hidden', cat !== selectedCategory)
      );
      initSections(selectedCategory);
      renderSections();
    });
  });

  /* ── 별점 ── */
  function setStarFills(rating) {
    for (let i = 1; i <= 5; i++) {
      const fill = document.getElementById(`sf${i}`);
      if (!fill) continue;
      fill.style.width = rating >= i ? '100%' : rating >= i - 0.5 ? '50%' : '0%';
    }
  }

  function updateRating(val) {
    selectedRating = val;
    document.getElementById('ratingValue').textContent = `${val} / 5`;
    setStarFills(val);
  }

  document.getElementById('starsDisplay').querySelectorAll('.zone').forEach((zone) => {
    zone.addEventListener('mouseenter', () => setStarFills(parseFloat(zone.dataset.val)));
    zone.addEventListener('click', () => updateRating(parseFloat(zone.dataset.val)));
  });
  document.getElementById('starsDisplay').addEventListener('mouseleave', () => setStarFills(selectedRating));
  updateRating(4.5);

  /* ── 정보 사진 ── */
  const infoUploadZone  = document.getElementById('infoUploadZone');
  const infoPhotoInput  = document.getElementById('infoPhotoInput');
  const infoPreviewWrap = document.getElementById('infoPreviewWrap');
  const infoPreviewImg  = document.getElementById('infoPreviewImg');
  const extractSpinner  = document.getElementById('extractSpinner');
  const infoExtractText = document.getElementById('infoExtractText');

  infoUploadZone.addEventListener('click', () => infoPhotoInput.click());
  infoUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); infoUploadZone.classList.add('drag-over'); });
  infoUploadZone.addEventListener('dragleave', () => infoUploadZone.classList.remove('drag-over'));
  infoUploadZone.addEventListener('drop', (e) => {
    e.preventDefault(); infoUploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleInfoPhoto(file);
  });
  infoPhotoInput.addEventListener('change', () => {
    if (infoPhotoInput.files[0]) handleInfoPhoto(infoPhotoInput.files[0]);
    infoPhotoInput.value = '';
  });

  document.getElementById('pasteClipboardBtn').addEventListener('click', async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          handleInfoPhoto(new File([blob], 'clipboard.png', { type: imageType }));
          return;
        }
      }
      showAlert('클립보드에 이미지가 없어요.\n네이버 지도 화면을 캡처한 뒤 다시 클릭해주세요.');
    } catch {
      showAlert('Ctrl+V(또는 Cmd+V)로 화면 어디서든 붙여넣기 할 수 있어요.');
    }
  });

  document.getElementById('clearInfoPhoto').addEventListener('click', () => {
    infoPreviewWrap.classList.add('hidden');
    infoUploadZone.style.display = '';
  });

  async function handleInfoPhoto(file) {
    infoPreviewImg.src = URL.createObjectURL(file);
    infoPreviewWrap.classList.remove('hidden');
    infoUploadZone.style.display = 'none';
    extractSpinner.classList.remove('hidden');
    infoExtractText.textContent = 'AI 분석 중...';
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('category', selectedCategory);
      const resp = await fetch('/api/extract-info', { method: 'POST', headers: { 'x-api-key': connectedApiKey }, body: fd });
      if (!resp.ok) { const e = await resp.json().catch(() => ({ error: `오류 ${resp.status}` })); throw new Error(e.error); }
      const data = await resp.json();
      fillFields(data);
      extractSpinner.classList.add('hidden');
      infoExtractText.textContent = '자동 입력 완료! 수정이 필요하면 직접 편집해주세요';
    } catch (err) {
      extractSpinner.classList.add('hidden');
      infoExtractText.textContent = `추출 실패: ${err.message}`;
    }
  }

  function fillFields(data) {
    const group = fieldGroups[selectedCategory];
    Object.entries(data).forEach(([key, val]) => {
      if (!val) return;
      const input = group.querySelector(`input[type="text"][name="${key}"]`);
      if (input) { input.value = val; input.classList.add('ai-filled'); }
      group.querySelectorAll(`input[type="radio"][name="${key}"]`).forEach((r) => {
        if (r.value === val) r.checked = true;
      });
    });
  }

  /* ── STEP 3: 목차별 사진 ── */
  const sectionsContainer = document.getElementById('sectionsContainer');
  const addSectionBtn     = document.getElementById('addSectionBtn');

  initSections(selectedCategory);
  renderSections();

  addSectionBtn.addEventListener('click', () => {
    sections.push({ name: '', photos: [], fixed: false });
    renderSections();
  });

  function getGlobalPhotoIndex(sectionIdx, localIdx) {
    let offset = 0;
    for (let i = 0; i < sectionIdx; i++) offset += sections[i].photos.length;
    return offset + localIdx + 1;
  }

  function addPhotosToSection(sectionIdx, files) {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    const sec = sections[sectionIdx];
    sec.photos.push(...imgs.slice(0, 60 - sec.photos.length));
    renderSectionGrid(sectionIdx);
  }

  function deletePhotoFromSection(sectionIdx, photoIdx) {
    const file = sections[sectionIdx].photos[photoIdx];
    const url = thumbnailCache.get(file);
    if (url) { URL.revokeObjectURL(url); thumbnailCache.delete(file); }
    sections[sectionIdx].photos.splice(photoIdx, 1);
    renderSectionGrid(sectionIdx);
  }

  function buildSectionCard(section, idx) {
    const card = document.createElement('div');
    card.className = 'section-card';
    const header = document.createElement('div');
    header.className = 'section-card-header';

    if (section.fixed) {
      const numLabel = document.createElement('span');
      numLabel.className = 'section-title-num';
      numLabel.textContent = `${idx + 1}.`;
      const input = document.createElement('input');
      input.className = 'section-title-input';
      input.type = 'text';
      input.value = section.name;
      input.addEventListener('input', () => { section.name = input.value; });
      header.appendChild(numLabel);
      header.appendChild(input);
    } else {
      const input = document.createElement('input');
      input.className = 'section-title-input';
      input.type = 'text';
      input.placeholder = '목차 이름 입력';
      input.value = section.name;
      input.addEventListener('input', () => { section.name = input.value; });
      header.appendChild(input);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-section';
      removeBtn.title = '목차 삭제';
      removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
      removeBtn.addEventListener('click', () => {
        section.photos.forEach(f => { const u = thumbnailCache.get(f); if (u) { URL.revokeObjectURL(u); thumbnailCache.delete(f); } });
        sections.splice(idx, 1);
        renderSections();
      });
      header.appendChild(removeBtn);
    }

    const countBadge = document.createElement('span');
    countBadge.className = 'section-count';
    countBadge.id = `secBadge_${idx}`;
    countBadge.textContent = `${section.photos.length}장`;
    header.appendChild(countBadge);
    card.appendChild(header);

    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.multiple = true; fileInput.accept = 'image/*'; fileInput.hidden = true;

    const zone = document.createElement('div');
    zone.className = 'section-upload-zone';
    zone.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20" style="display:block;margin:0 auto 6px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>클릭하거나 드래그해서 사진 추가`;
    zone.appendChild(fileInput);
    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); addPhotosToSection(idx, Array.from(e.dataTransfer.files)); });
    fileInput.addEventListener('change', () => { addPhotosToSection(idx, Array.from(fileInput.files)); fileInput.value = ''; });
    card.appendChild(zone);

    const bar = document.createElement('div');
    bar.className = 'section-photo-bar';
    const countText = document.createElement('span');
    countText.className = 'section-count-text';
    countText.id = `secText_${idx}`;
    countText.textContent = `${section.photos.length}장 선택됨`;
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-text-danger';
    clearBtn.textContent = '모두 지우기';
    clearBtn.addEventListener('click', () => {
      section.photos.forEach(f => { const u = thumbnailCache.get(f); if (u) { URL.revokeObjectURL(u); thumbnailCache.delete(f); } });
      section.photos = [];
      renderSectionGrid(idx);
    });
    bar.append(countText, clearBtn);
    card.appendChild(bar);

    const grid = document.createElement('div');
    grid.className = 'section-photo-grid';
    grid.dataset.sectionIndex = idx;
    card.appendChild(grid);

    return card;
  }

  function renderSections() {
    sectionsContainer.innerHTML = '';
    sections.forEach((sec, idx) => sectionsContainer.appendChild(buildSectionCard(sec, idx)));
    sections.forEach((_, idx) => renderSectionGrid(idx));
  }

  async function renderSectionGrid(sectionIdx) {
    const section = sections[sectionIdx];
    if (!section) return;
    const grid = sectionsContainer.querySelector(`.section-photo-grid[data-section-index="${sectionIdx}"]`);
    if (!grid) return;
    const n = section.photos.length;
    const badge = document.getElementById(`secBadge_${sectionIdx}`);
    const textEl = document.getElementById(`secText_${sectionIdx}`);
    if (badge) badge.textContent = `${n}장`;
    if (textEl) textEl.textContent = `${n}장 선택됨`;
    grid.innerHTML = '';
    if (n === 0) return;
    const thumbUrls = await Promise.all(section.photos.map(f => getThumbnailUrl(f)));
    section.photos.forEach((file, i) => {
      const globalNum = getGlobalPhotoIndex(sectionIdx, i);
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb';
      thumb.draggable = true;
      thumb.title = '클릭: 미리보기 · 드래그: 순서 변경';
      const num = document.createElement('span');
      num.className = 'thumb-num';
      num.textContent = globalNum;
      const img = document.createElement('img');
      img.src = thumbUrls[i];
      img.draggable = false;
      const delBtn = document.createElement('button');
      delBtn.className = 'thumb-del';
      delBtn.title = '삭제';
      delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); deletePhotoFromSection(sectionIdx, i); });
      thumb.addEventListener('click', () => openLightbox(file, globalNum));
      thumb.addEventListener('dragstart', (e) => {
        dragSrcSection = sectionIdx; dragSrcIndex = i;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => thumb.classList.add('dragging'), 0);
      });
      thumb.addEventListener('dragend', () => thumb.classList.remove('dragging'));
      thumb.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; thumb.classList.add('drag-over-thumb'); });
      thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over-thumb'));
      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        thumb.classList.remove('drag-over-thumb');
        if (dragSrcSection === sectionIdx && dragSrcIndex !== null && dragSrcIndex !== i) {
          const [dragged] = section.photos.splice(dragSrcIndex, 1);
          section.photos.splice(i, 0, dragged);
          dragSrcIndex = null; dragSrcSection = null;
          renderSectionGrid(sectionIdx);
        }
      });
      thumb.append(img, num, delBtn);
      grid.appendChild(thumb);
    });
  }

  /* ── 라이트박스 ── */
  function openLightbox(file, num) {
    if (lightboxObjectUrl) URL.revokeObjectURL(lightboxObjectUrl);
    lightboxObjectUrl = URL.createObjectURL(file);
    document.getElementById('lightboxImg').src = lightboxObjectUrl;
    document.getElementById('lightboxNum').textContent = `사진 ${num}`;
    document.getElementById('lightbox').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
    if (lightboxObjectUrl) { URL.revokeObjectURL(lightboxObjectUrl); lightboxObjectUrl = null; }
    document.getElementById('lightboxImg').src = '';
    document.body.style.overflow = '';
  }

  document.getElementById('lightboxBackdrop').addEventListener('click', closeLightbox);
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

  /* ── 폼 데이터 수집 ── */
  function collectFormData() {
    const group = fieldGroups[selectedCategory];
    const data = {};
    group.querySelectorAll('input[type="text"]').forEach((inp) => {
      if (inp.name) data[inp.name] = inp.value.trim();
    });
    const radioNames = [...new Set([...group.querySelectorAll('input[type="radio"]')].map(r => r.name))];
    radioNames.forEach(name => {
      const r = group.querySelector(`input[type="radio"][name="${name}"]:checked`);
      if (r) data[name] = r.value;
    });
    return data;
  }

  function stripMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      .replace(/~~(.+?)~~/g, '$1').replace(/^#{1,6}\s+/gm, '')
      .replace(/`(.+?)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }

  function buildBodyHtml(rawBody) {
    const parts = rawBody.split(/(\[사진\d+\])/);
    return parts.map(part => {
      if (/^\[사진\d+\]$/.test(part)) return `<span class="photo-marker">${part}</span>`;
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }).join('');
  }

  /* ── 생성 ── */
  document.getElementById('generateBtn').addEventListener('click', async () => {
    const info = collectFormData();
    if (!info.name || !info.location) { await showAlert('장소명과 위치는 필수 입력 항목이에요!'); return; }
    const totalPhotos = sections.reduce((sum, s) => sum + s.photos.length, 0);
    if (totalPhotos === 0) { await showAlert('리뷰 사진을 최소 1장 이상 업로드해주세요!'); return; }
    if (totalPhotos < 30) {
      const ok = await showConfirm(`현재 총 ${totalPhotos}장 업로드됐어요.\n30장 이상이면 더 풍성한 글이 완성돼요.\n그래도 진행할까요?`);
      if (!ok) return;
    }

    const generateBtn = document.getElementById('generateBtn');
    const progressCard = document.getElementById('progressCard');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const progressDetail = document.getElementById('progressDetail');
    const resultCard = document.getElementById('resultCard');

    generateBtn.disabled = true;
    progressCard.classList.remove('hidden');
    resultCard.classList.add('hidden');
    progressBar.style.width = '0%';
    progressStatus.textContent = '준비 중...';
    progressDetail.textContent = '';

    const memo = document.getElementById('memoInput').value.trim();
    const fd = new FormData();
    fd.append('category', selectedCategory);
    fd.append('rating', selectedRating);
    if (memo) fd.append('memo', memo);
    Object.entries(info).forEach(([k, v]) => fd.append(k, v));
    const validSections = sections.filter(s => s.photos.length > 0);
    fd.append('sectionNames', JSON.stringify(validSections.map(s => s.name || '기타')));
    fd.append('sectionCounts', JSON.stringify(validSections.map(s => s.photos.length)));
    validSections.forEach(s => s.photos.forEach(f => fd.append('photos', f)));

    try {
      const resp = await fetch('/api/generate', { method: 'POST', headers: { 'x-api-key': connectedApiKey }, body: fd });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || `오류 ${resp.status}`); }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { handleEvent(JSON.parse(line.slice(6)), { progressBar, progressStatus, progressDetail, resultCard }); } catch {}
        }
      }
    } catch (err) {
      showAlert(`오류가 발생했어요.\n${err.message}`);
      progressCard.classList.add('hidden');
    } finally {
      generateBtn.disabled = false;
    }
  });

  function handleEvent(ev, els) {
    const { progressBar, progressStatus, progressDetail, resultCard } = els;
    if (ev.type === 'status') {
      progressStatus.textContent = ev.message;
      if (ev.message.includes('블로그')) { progressBar.style.width = '90%'; progressDetail.textContent = '블로그 글 작성 중... 잠시만요'; }
    }
    if (ev.type === 'progress') {
      progressBar.style.width = `${Math.round((ev.current / ev.total) * 80)}%`;
      progressDetail.textContent = `사진 분석: ${ev.current} / ${ev.total}장`;
    }
    if (ev.type === 'complete') {
      progressBar.style.width = '100%';
      progressStatus.textContent = '완성!';
      const pc = document.getElementById('progressCard');
      setTimeout(() => { pc.classList.add('hidden'); showResult(ev.result, resultCard); }, 600);
    }
    if (ev.type === 'error') {
      showAlert(`오류가 발생했어요.\n${ev.message}`);
      document.getElementById('progressCard').classList.add('hidden');
      document.getElementById('generateBtn').disabled = false;
    }
  }

  function showResult(r, resultCard) {
    document.getElementById('titleOutput').textContent = r.title || '';
    rawBodyText = stripMarkdown(r.body || '');
    document.getElementById('bodyOutput').innerHTML = buildBodyHtml(rawBodyText);
    const tagsBox = document.getElementById('tagsOutput');
    tagsBox.innerHTML = '';
    const tags = Array.isArray(r.hashtags) ? r.hashtags : (r.hashtags || '').split(/\s+/).filter(t => t.startsWith('#'));
    tags.forEach((tag) => {
      const chip = document.createElement('button');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      chip.title = '클릭하면 복사';
      chip.addEventListener('click', () => copyText(tag.replace(/^#/, ''), `${tag} 태그가`));
      tagsBox.appendChild(chip);
    });
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── 복사 ── */
  document.getElementById('copyTitle').addEventListener('click', () =>
    copyText(document.getElementById('titleOutput').textContent, '제목이')
  );
  document.getElementById('copyBody').addEventListener('click', () => copyText(rawBodyText, '본문이'));
  document.getElementById('copyAll').addEventListener('click', () => {
    const title = document.getElementById('titleOutput').textContent;
    copyText(`${title}\n\n${rawBodyText}`, '전체 글이');
  });

  /* ── 스티키 헤더 스크롤 ── */
  document.getElementById('stickyStartBtn').addEventListener('click', () => {
    document.getElementById('apiCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const handleScroll = () => {
    const threshold = heroSection.offsetHeight * 0.55;
    stickyHeader.classList.toggle('visible', window.scrollY > threshold);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ── 클립보드 붙여넣기 (전역) ── */
  const handlePaste = (e) => {
    if (mainSteps.classList.contains('locked')) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) { handleInfoPhoto(item.getAsFile()); break; }
    }
  };
  document.addEventListener('paste', handlePaste);

  /* ── Escape 키 ── */
  const handleKeydown = (e) => {
    if (e.key !== 'Escape') return;
    closeLightbox();
    const overlay = document.getElementById('customModal');
    if (!overlay.classList.contains('hidden') && !overlay.dataset.confirm) {
      overlay.classList.add('hidden');
    }
  };
  document.addEventListener('keydown', handleKeydown);

  /* ── 자동 연동 ── */
  const savedKey = sessionStorage.getItem('gemini_key');
  if (savedKey) { apiKeyInput.value = savedKey; connectBtn.click(); }

  /* ── cleanup ── */
  return function unmount() {
    document.removeEventListener('paste', handlePaste);
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', handleScroll);
    stickyHeader.classList.remove('visible');
    document.body.style.overflow = '';
    if (lightboxObjectUrl) { URL.revokeObjectURL(lightboxObjectUrl); lightboxObjectUrl = null; }
    thumbnailCache.forEach((url) => URL.revokeObjectURL(url));
    thumbnailCache.clear();
  };
}
