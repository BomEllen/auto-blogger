let toastTimer;

function showToast(label) {
  const toast = document.getElementById('copyToast');
  toast.textContent = `${label} 복사됐어요!`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

export async function copyText(text, label) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    Object.assign(ta.style, { position: 'fixed', opacity: '0' });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  showToast(label);
}

export async function copyHtml(html, plainText, label) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([`<html><body>${html}</body></html>`], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
    showToast(label);
  } catch {
    await copyText(plainText, label);
  }
}

export function showAlert(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModal');
    delete overlay.dataset.confirm;
    document.getElementById('modalMessage').textContent = message;
    const actions = document.getElementById('modalActions');
    actions.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'modal-btn-ok';
    btn.textContent = '확인';
    btn.addEventListener('click', () => { overlay.classList.add('hidden'); resolve(); });
    actions.appendChild(btn);
    overlay.classList.remove('hidden');
    btn.focus();
  });
}

export function showConfirm(message, okText = '진행하기', cancelText = '취소') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModal');
    overlay.dataset.confirm = '1';
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
