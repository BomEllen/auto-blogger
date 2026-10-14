import { showAlert, showConfirm, copyText } from '../utils.js';

const STATUS_LABEL = { pending: '대기', analyzed: '분석 완료', purged: '정리됨' };
const STATUS_CLASS = { pending: 'rv-badge-pending', analyzed: 'rv-badge-analyzed', purged: 'rv-badge-purged' };

export function getHTML() {
  return `
  <div class="info-blog-page">
    <div class="info-blog-hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="info-blog-hero-inner">
        <div class="hero-badge">가이드 개선</div>
        <h1 class="info-blog-heading">퇴고 학습</h1>
        <p class="info-blog-sub">AI 원본과 실제로 올린 최종본의 차이를 모아서 가이드 개선 방향을 제안받아요</p>
      </div>
    </div>

    <div class="info-blog-wrapper">

      <section class="card">
        <div class="rv-toolbar">
          <div class="rv-tabs" id="rvTabs">
            <button type="button" class="rv-tab active" data-type="info">정보성 블로그</button>
            <button type="button" class="rv-tab" data-type="review">리뷰 블로그</button>
          </div>
          <div class="rv-io-actions">
            <button type="button" class="btn-copy" id="rvExportBtn">전체 내보내기</button>
            <button type="button" class="btn-copy" id="rvImportBtn">가져오기</button>
            <input type="file" id="rvImportInput" accept="application/json" hidden />
          </div>
        </div>

        <div class="rv-analyze-row">
          <button type="button" class="btn-tg-generate" id="rvAnalyzeBtn" disabled>분석하기</button>
          <span class="rv-analyze-hint" id="rvAnalyzeHint">불러오는 중...</span>
        </div>

        <div class="rv-list" id="rvList"></div>

        <div class="rv-purge-row hidden" id="rvPurgeRow">
          <span class="ib-hint">선택한 분석 완료 쌍의 원문(원본·최종본)만 삭제해요. 제목·날짜·메모·분석 요약은 남아요.</span>
          <button type="button" class="btn-ib-del-outline" id="rvPurgeBtn">선택한 원문 삭제</button>
        </div>
      </section>

      <section class="card tg-result-card hidden" id="rvReportCard">
        <div class="result-header">
          <h2>분석 리포트</h2>
          <div class="result-actions">
            <button class="btn-copy" id="rvCopyReportBtn">리포트 복사</button>
          </div>
        </div>
        <div class="result-section">
          <div class="rv-report-box" id="rvReportBox"></div>
        </div>
      </section>

      <!-- 에러 -->
      <p class="tg-error hidden" id="rvError"></p>

    </div>
  </div>
  `;
}

export function mount() {
  const apiKey = sessionStorage.getItem('gemini_key');

  const rvTabs = document.getElementById('rvTabs');
  const rvList = document.getElementById('rvList');
  const rvAnalyzeBtn = document.getElementById('rvAnalyzeBtn');
  const rvAnalyzeHint = document.getElementById('rvAnalyzeHint');
  const rvPurgeRow = document.getElementById('rvPurgeRow');
  const rvPurgeBtn = document.getElementById('rvPurgeBtn');
  const rvReportCard = document.getElementById('rvReportCard');
  const rvReportBox = document.getElementById('rvReportBox');
  const rvError = document.getElementById('rvError');
  const rvExportBtn = document.getElementById('rvExportBtn');
  const rvImportBtn = document.getElementById('rvImportBtn');
  const rvImportInput = document.getElementById('rvImportInput');

  let currentType = 'info';
  let items = [];

  function showError(msg) {
    rvError.textContent = msg;
    rvError.classList.remove('hidden');
  }
  function clearError() {
    rvError.classList.add('hidden');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function renderList() {
    if (items.length === 0) {
      rvList.innerHTML = `<p class="ib-hint">아직 저장된 쌍이 없어요. 글 생성 결과 화면에서 "학습용으로 저장"을 눌러 쌓아주세요.</p>`;
    } else {
      rvList.innerHTML = items.map((it) => `
        <div class="rv-row" data-id="${it.id}">
          <label class="rv-row-check">
            <input type="checkbox" class="rv-check" data-id="${it.id}" ${it.status !== 'analyzed' ? 'disabled' : ''} />
          </label>
          <div class="rv-row-main">
            <div class="rv-row-title">
              ${it.title}
              ${it.exampleCandidate ? `<span class="rv-badge rv-badge-example" title="${(it.exampleCandidate.reason || '').replace(/"/g, '&quot;')}">예시 후보 ${it.exampleCandidate.score ?? ''}</span>` : ''}
              <span class="rv-badge ${STATUS_CLASS[it.status] || ''}">${STATUS_LABEL[it.status] || it.status}</span>
            </div>
            <div class="rv-row-meta">
              <span>${fmtDate(it.createdAt)}</span>
              ${it.subtitle ? `<span>· ${it.subtitle}</span>` : ''}
              ${it.memo ? `<span>· ${it.memo}</span>` : ''}
            </div>
            ${it.analysisSummary ? `<div class="rv-row-summary">${it.analysisSummary}</div>` : ''}
          </div>
        </div>
      `).join('');
    }

    const pending = items.filter((it) => it.status === 'pending' && it.hasText).length;
    const hasAnalyzed = items.some((it) => it.status === 'analyzed');
    rvPurgeRow.classList.toggle('hidden', !hasAnalyzed);

    if (pending < 3) {
      rvAnalyzeBtn.disabled = true;
      rvAnalyzeHint.textContent = `데이터 부족 (${pending}/3) — 최종본을 3개 이상 저장하면 분석할 수 있어요`;
    } else {
      rvAnalyzeBtn.disabled = false;
      rvAnalyzeHint.textContent = `분석 대기 중 ${pending}쌍`;
    }
  }

  async function loadList() {
    clearError();
    rvAnalyzeHint.textContent = '불러오는 중...';
    try {
      const res = await fetch(`/api/revisions?blogType=${currentType}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '목록을 불러오지 못했어요.');
      items = data.items || [];
      renderList();
    } catch (err) {
      showError(err.message);
    }
  }

  rvTabs.querySelectorAll('.rv-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.type === currentType) return;
      currentType = btn.dataset.type;
      rvTabs.querySelectorAll('.rv-tab').forEach((b) => b.classList.toggle('active', b === btn));
      rvReportCard.classList.add('hidden');
      loadList();
    });
  });

  rvAnalyzeBtn.addEventListener('click', async () => {
    if (!apiKey) { await showAlert('API 키가 없어요. 홈에서 먼저 Gemini API 키를 연동해주세요.'); return; }
    clearError();
    rvAnalyzeBtn.disabled = true;
    rvAnalyzeBtn.textContent = '분석 중...';
    try {
      const res = await fetch('/api/revisions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ blogType: currentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '분석에 실패했어요.');
      rvReportBox.textContent = data.report;
      rvReportCard.classList.remove('hidden');
      rvReportCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await loadList();
    } catch (err) {
      showError(err.message);
    } finally {
      rvAnalyzeBtn.textContent = '분석하기';
      rvAnalyzeBtn.disabled = false;
      renderList();
    }
  });

  document.getElementById('rvCopyReportBtn').addEventListener('click', () => {
    copyText(rvReportBox.textContent, '리포트');
  });

  rvPurgeBtn.addEventListener('click', async () => {
    const checked = [...rvList.querySelectorAll('.rv-check:checked')].map((c) => c.dataset.id);
    if (checked.length === 0) { await showAlert('삭제할 항목을 선택해주세요.'); return; }

    const hasExampleCandidate = items.some((it) => checked.includes(it.id) && it.exampleCandidate);
    const warnLine = hasExampleCandidate
      ? '\n\n⚠️ 선택한 항목 중 예시 글 후보로 추천된 쌍이 있어요. 지우면 §20에 넣을 원문이 사라져요.'
      : '';
    const ok = await showConfirm(`선택한 ${checked.length}건의 원문(원본·최종본)을 삭제할까요?\n제목·날짜·메모·분석 요약은 남아요.${warnLine}`);
    if (!ok) return;

    try {
      const res = await fetch('/api/revisions/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제에 실패했어요.');
      await loadList();
    } catch (err) {
      showError(err.message);
    }
  });

  rvExportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/revisions/export');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '내보내기에 실패했어요.');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revisions-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(err.message);
    }
  });

  rvImportBtn.addEventListener('click', () => rvImportInput.click());
  rvImportInput.addEventListener('change', async () => {
    const file = rvImportInput.files[0];
    rvImportInput.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importItems = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(importItems)) throw new Error('올바른 백업 파일이 아니에요.');

      const ok = await showConfirm(`${importItems.length}건을 가져올까요? 같은 id가 있으면 덮어써요.`);
      if (!ok) return;

      const res = await fetch('/api/revisions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '가져오기에 실패했어요.');
      await showAlert(`${data.imported}건 가져왔어요.`);
      await loadList();
    } catch (err) {
      await showAlert(err.message);
    }
  });

  loadList();

  return function unmount() {};
}
