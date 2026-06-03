/* ── State ── */
let selectedCategory = 'cafe';
let selectedRating = 4.5;
let selectedPhotos = [];
let connectedApiKey = '';
let rawBodyText = '';
let dragSrcIndex = null;
let lightboxObjectUrl = null;
let modalResolve = null;
const thumbnailCache = new Map(); // File -> blob URL

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

/* ── DOM ── */
const apiCard         = document.getElementById('apiCard');
const apiCardDesc     = document.getElementById('apiCardDesc');
const apiBadge        = document.getElementById('apiBadge');
const apiKey          = document.getElementById('apiKey');
const toggleKeyBtn    = document.getElementById('toggleKey');
const connectBtn      = document.getElementById('connectBtn');
const apiInputRow     = document.getElementById('apiInputRow');
const apiConnectedRow = document.getElementById('apiConnectedRow');
const maskedKey       = document.getElementById('maskedKey');
const changeKeyBtn    = document.getElementById('changeKeyBtn');
const apiError        = document.getElementById('apiError');
const mainSteps       = document.getElementById('mainSteps');

/* ─────────────────────────────────────────
   API 키 연동
───────────────────────────────────────── */
toggleKeyBtn.addEventListener('click', () => {
  const isPassword = apiKey.type === 'password';
  apiKey.type = isPassword ? 'text' : 'password';
  const svg = toggleKeyBtn.querySelector('svg');
  if (isPassword) {
    svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />`;
  } else {
    svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />`;
  }
});

apiKey.addEventListener('keydown', (e) => { if (e.key === 'Enter') connectBtn.click(); });

connectBtn.addEventListener('click', async () => {
  const key = apiKey.value.trim();
  if (!key) { showApiError('API 키를 입력해주세요.'); return; }

  connectBtn.disabled = true;
  connectBtn.textContent = '연동 중...';
  hideApiError();

  try {
    const resp = await fetch('/api/verify-key', {
      method: 'POST',
      headers: { 'x-api-key': key },
    });
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
  apiKey.value = '';
  mainSteps.classList.add('locked');
}

function showApiError(msg) { apiError.textContent = msg; apiError.classList.remove('hidden'); }
function hideApiError() { apiError.classList.add('hidden'); }

const savedKey = sessionStorage.getItem('gemini_key');
if (savedKey) { apiKey.value = savedKey; connectBtn.click(); }

/* ─────────────────────────────────────────
   카테고리
───────────────────────────────────────── */
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
  });
});

/* ─────────────────────────────────────────
   별점
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   정보 사진 — 파일 업로드 + 클립보드 붙여넣기
───────────────────────────────────────── */
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
  e.preventDefault();
  infoUploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith('image/')) handleInfoPhoto(file);
});
infoPhotoInput.addEventListener('change', () => {
  if (infoPhotoInput.files[0]) handleInfoPhoto(infoPhotoInput.files[0]);
  infoPhotoInput.value = '';
});

// Ctrl+V 붙여넣기 (어디서든 동작)
document.addEventListener('paste', (e) => {
  if (mainSteps.classList.contains('locked')) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) handleInfoPhoto(file);
      break;
    }
  }
});

// 클립보드 버튼 — Clipboard API로 이미지 직접 읽기
document.getElementById('pasteClipboardBtn').addEventListener('click', async () => {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((t) => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const file = new File([blob], 'clipboard.png', { type: imageType });
        handleInfoPhoto(file);
        return;
      }
    }
    showAlert('클립보드에 이미지가 없어요.\n네이버 지도 화면을 캡처(Cmd+Shift+4 / PrtSc)한 뒤 다시 클릭해주세요.');
  } catch {
    // 권한 거부 또는 미지원 → Ctrl+V 안내
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

    const resp = await fetch('/api/extract-info', {
      method: 'POST',
      headers: { 'x-api-key': connectedApiKey },
      body: fd,
    });

    if (!resp.ok) {
      const e = await resp.json().catch(() => ({ error: `오류 ${resp.status}` }));
      throw new Error(e.error);
    }

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
  let filled = 0;
  Object.entries(data).forEach(([key, val]) => {
    if (!val) return;
    const input = group.querySelector(`input[type="text"][name="${key}"]`);
    if (input) { input.value = val; input.classList.add('ai-filled'); filled++; }
    group.querySelectorAll(`input[type="radio"][name="${key}"]`).forEach((r) => {
      if (r.value === val) { r.checked = true; filled++; }
    });
  });
  return filled;
}

/* ─────────────────────────────────────────
   리뷰 사진
───────────────────────────────────────── */
const uploadZone   = document.getElementById('uploadZone');
const photoInput   = document.getElementById('photoInput');
const photoGrid    = document.getElementById('photoGrid');
const photoCountEl = document.getElementById('photoCount');

uploadZone.addEventListener('click', () => photoInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => { e.preventDefault(); uploadZone.classList.remove('drag-over'); addPhotos(Array.from(e.dataTransfer.files)); });
photoInput.addEventListener('change', () => { addPhotos(Array.from(photoInput.files)); photoInput.value = ''; });
document.getElementById('clearPhotos').addEventListener('click', () => {
  selectedPhotos.forEach((f) => { const u = thumbnailCache.get(f); if (u) URL.revokeObjectURL(u); });
  thumbnailCache.clear();
  selectedPhotos = [];
  renderPhotoGrid();
});

function addPhotos(files) {
  const imgs = files.filter((f) => f.type.startsWith('image/'));
  selectedPhotos.push(...imgs.slice(0, 60 - selectedPhotos.length));
  renderPhotoGrid();
}

function deletePhoto(index) {
  const file = selectedPhotos[index];
  const url = thumbnailCache.get(file);
  if (url) { URL.revokeObjectURL(url); thumbnailCache.delete(file); }
  selectedPhotos.splice(index, 1);
  renderPhotoGrid();
}

async function renderPhotoGrid() {
  photoGrid.innerHTML = '';
  const n = selectedPhotos.length;
  photoCountEl.textContent = `${n}장 선택됨`;
  photoCountEl.className = 'photo-count-text' + (n >= 30 ? ' count-good' : n > 0 ? ' count-warn' : '');

  const thumbUrls = await Promise.all(selectedPhotos.map((f) => getThumbnailUrl(f)));

  selectedPhotos.forEach((file, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    thumb.draggable = true;
    thumb.title = '클릭: 미리보기 · 드래그: 순서 변경';

    const num = document.createElement('span');
    num.className = 'thumb-num';
    num.textContent = i + 1;

    const img = document.createElement('img');
    img.src = thumbUrls[i];
    img.draggable = false;

    const delBtn = document.createElement('button');
    delBtn.className = 'thumb-del';
    delBtn.title = '삭제';
    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); deletePhoto(i); });

    // 클릭 → 라이트박스 (원본 해상도 유지)
    thumb.addEventListener('click', () => openLightbox(file, i + 1));

    // 드래그 순서 변경
    thumb.addEventListener('dragstart', (e) => {
      dragSrcIndex = i;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => thumb.classList.add('dragging'), 0);
    });
    thumb.addEventListener('dragend', () => thumb.classList.remove('dragging'));
    thumb.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      thumb.classList.add('drag-over-thumb');
    });
    thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over-thumb'));
    thumb.addEventListener('drop', (e) => {
      e.preventDefault();
      thumb.classList.remove('drag-over-thumb');
      if (dragSrcIndex !== null && dragSrcIndex !== i) {
        const [dragged] = selectedPhotos.splice(dragSrcIndex, 1);
        selectedPhotos.splice(i, 0, dragged);
        dragSrcIndex = null;
        renderPhotoGrid();
      }
    });

    thumb.append(img, num, delBtn);
    photoGrid.appendChild(thumb);
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    const overlay = document.getElementById('customModal');
    if (!overlay.classList.contains('hidden') && !overlay.dataset.confirm) {
      overlay.classList.add('hidden');
      if (modalResolve) { modalResolve(); modalResolve = null; }
    }
  }
});

/* ── 커스텀 모달 ── */
document.getElementById('modalBd').addEventListener('click', () => {
  const overlay = document.getElementById('customModal');
  if (!overlay.dataset.confirm) {
    overlay.classList.add('hidden');
    if (modalResolve) { modalResolve(); modalResolve = null; }
  }
});

function showAlert(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModal');
    delete overlay.dataset.confirm;
    modalResolve = resolve;
    document.getElementById('modalMessage').textContent = message;
    const actions = document.getElementById('modalActions');
    actions.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'modal-btn-ok';
    btn.textContent = '확인';
    btn.addEventListener('click', () => { overlay.classList.add('hidden'); modalResolve = null; resolve(); });
    actions.appendChild(btn);
    overlay.classList.remove('hidden');
    btn.focus();
  });
}

function showConfirm(message, okText = '진행하기', cancelText = '취소') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModal');
    overlay.dataset.confirm = '1';
    modalResolve = null;
    document.getElementById('modalMessage').textContent = message;
    const actions = document.getElementById('modalActions');
    actions.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn-cancel';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', () => { overlay.classList.add('hidden'); resolve(false); });
    const okBtn = document.createElement('button');
    okBtn.className = 'modal-btn-ok';
    okBtn.textContent = okText;
    okBtn.addEventListener('click', () => { overlay.classList.add('hidden'); resolve(true); });
    actions.append(cancelBtn, okBtn);
    overlay.classList.remove('hidden');
    okBtn.focus();
  });
}

/* ─────────────────────────────────────────
   폼 데이터 수집
───────────────────────────────────────── */
function collectFormData() {
  const group = fieldGroups[selectedCategory];
  const data = {};
  group.querySelectorAll('input[type="text"]').forEach((inp) => {
    if (inp.name) data[inp.name] = inp.value.trim();
  });
  const checked = group.querySelector('input[type="radio"]:checked');
  if (checked) data[checked.name] = checked.value;
  // 라디오 여러 그룹 수집
  const radioNames = [...new Set([...group.querySelectorAll('input[type="radio"]')].map(r => r.name))];
  radioNames.forEach(name => {
    const r = group.querySelector(`input[type="radio"][name="${name}"]:checked`);
    if (r) data[name] = r.value;
  });
  return data;
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function buildBodyHtml(rawBody) {
  const parts = rawBody.split(/(\[사진\d+\])/);
  return parts.map(part => {
    if (/^\[사진\d+\]$/.test(part)) {
      return `<span class="photo-marker">${part}</span>`;
    }
    return part
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }).join('');
}

/* ─────────────────────────────────────────
   생성
───────────────────────────────────────── */
document.getElementById('generateBtn').addEventListener('click', async () => {
  const info = collectFormData();
  if (!info.name || !info.location) { await showAlert('장소명과 위치는 필수 입력 항목이에요!'); return; }
  if (selectedPhotos.length === 0) { await showAlert('리뷰 사진을 최소 1장 이상 업로드해주세요!'); return; }
  if (selectedPhotos.length < 30) {
    const ok = await showConfirm(`현재 ${selectedPhotos.length}장 업로드됐어요.\n30장 이상이면 더 풍성한 글이 완성돼요.\n그래도 진행할까요?`);
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
  selectedPhotos.forEach((f) => fd.append('photos', f));

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'x-api-key': connectedApiKey },
      body: fd,
    });

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
    if (ev.message.includes('블로그')) {
      progressBar.style.width = '90%';
      progressDetail.textContent = '블로그 글 작성 중... 잠시만요';
    }
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

  // 해시태그 칩 렌더링
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
document.getElementById('copyBody').addEventListener('click', () =>
  copyText(rawBodyText, '본문이')
);
document.getElementById('copyAll').addEventListener('click', () => {
  const title = document.getElementById('titleOutput').textContent;
  copyText(`${title}\n\n${rawBodyText}`, '전체 글이');
});

/* ── 스크롤 트리거 헤더 ── */
const heroSection = document.getElementById('heroSection');
const stickyHeader = document.getElementById('stickyHeader');

window.addEventListener('scroll', () => {
  const threshold = heroSection.offsetHeight * 0.55;
  stickyHeader.classList.toggle('visible', window.scrollY > threshold);
}, { passive: true });

document.getElementById('stickyStartBtn').addEventListener('click', () => {
  document.getElementById('apiCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

let toastTimer;
async function copyText(text, label) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    Object.assign(ta.style, { position: 'fixed', opacity: '0' });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  const toast = document.getElementById('copyToast');
  toast.textContent = `${label} 복사됐어요!`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}
