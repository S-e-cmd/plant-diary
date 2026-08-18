let installed = false;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function formatDate(value) {
  if (!value) return '日付なし';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return String(value);
  }
}

export function renderAnalysisHtml(data = {}) {
  const plantRows = (data.byPlant || []).map(item => `<li>${esc(item.name)} <b>${Number(item.count) || 0}</b>件</li>`).join('');
  const categoryRows = (data.byCategory || []).map(item => `<li>${esc(item.name)} <b>${Number(item.count) || 0}</b>件</li>`).join('');
  return `<div class="card"><div class="pin-title">${esc(data.month || '')} の履歴</div><div class="summary-stats"><div class="summary-stat"><b>${Number(data.actualCount) || 0}</b><span>今月の実施</span></div><div class="summary-stat"><b>${Number(data.pendingCount) || 0}</b><span>未完了予定</span></div></div></div>` +
    `<div class="card"><div class="pin-title">植物別</div>${plantRows ? `<ul class="summary-pending">${plantRows}</ul>` : '<div class="empty">集計対象はありません</div>'}</div>` +
    `<div class="card"><div class="pin-title">分類別</div>${categoryRows ? `<ul class="summary-pending">${categoryRows}</ul>` : '<div class="empty">集計対象はありません</div>'}</div>`;
}

export function renderUsageHtml(data = {}) {
  const rows = (data.usage || []).map(item => `<div class="log-card"><div class="log-top"><div><span class="badge">${esc(item.kind)}</span><div class="log-title">${esc(item.name)}</div><div class="log-meta">使用 ${Number(item.count) || 0}回${(item.plants || []).length ? `／${esc(item.plants.join('・'))}` : ''}</div></div><span class="log-date">${esc(formatDate(item.last))}</span></div></div>`).join('');
  return rows || '<div class="empty">使用履歴はありません</div>';
}

export function renderTrashHtml(items = []) {
  const rows = items.map(item => `<div class="log-card"><div class="log-top"><div><span class="badge ${item.type === 'plan' ? 'plan' : ''}">${item.type === 'plan' ? '予定' : '実施'}</span><div class="log-title">${esc(item.action)}</div><div class="log-meta">${esc([item.plantName, item.place, item.category].filter(Boolean).join('・'))}</div></div><span class="log-date">${esc(formatDate(item.date))}</span></div><div class="actions"><button data-restore-entry="${esc(item.type)}:${esc(item.id)}">復元</button></div></div>`).join('');
  return rows || '<div class="empty">削除済みの記録はありません</div>';
}

async function request(payload) {
  const response = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  let body;
  try { body = await response.json(); }
  catch { throw new Error('APIから正しい応答が返りませんでした。'); }
  if (!response.ok || !body?.ok) throw new Error(body?.error || '通信に失敗しました。');
  return body.data;
}

function openModal(title, html) {
  const modal = document.querySelector('#modal');
  const titleEl = document.querySelector('#modalTitle');
  const bodyEl = document.querySelector('#modalBody');
  if (!modal || !titleEl || !bodyEl) return false;
  titleEl.textContent = title;
  bodyEl.innerHTML = html;
  modal.classList.add('show');
  return true;
}

function closeModal() {
  document.querySelector('#modal')?.classList.remove('show');
}

function setBusy(value, label) {
  if (typeof globalThis.busy === 'function') return globalThis.busy(value, label);
  const processing = document.querySelector('#processing');
  if (processing) processing.classList.toggle('show', value);
  if (value && label) {
    const text = document.querySelector('#processingText');
    if (text) text.textContent = label;
  }
}

function notify(message) {
  if (typeof globalThis.toast === 'function') return globalThis.toast(message);
}

async function fetchAnalysis(getState) {
  setBusy(true, '分析中…');
  try {
    const data = await request({ action: 'getAnalysis' });
    getState().analysis = data;
    return data;
  } catch (error) {
    notify(error.message);
    return null;
  } finally {
    setBusy(false);
  }
}

export function installLogToolsUi(getState) {
  if (installed || typeof document === 'undefined' || typeof getState !== 'function') return false;
  const analysisBtn = document.querySelector('#analysisBtn');
  const usageBtn = document.querySelector('#usageBtn');
  const trashBtn = document.querySelector('#trashBtn');
  if (!analysisBtn || !usageBtn || !trashBtn) return false;
  installed = true;

  analysisBtn.onclick = async () => {
    const data = await fetchAnalysis(getState);
    if (data) openModal('履歴分析', renderAnalysisHtml(data));
  };

  usageBtn.onclick = async () => {
    const state = getState();
    const data = state.analysis || await fetchAnalysis(getState);
    if (data) openModal('資材・薬剤の使用履歴', renderUsageHtml(data));
  };

  trashBtn.onclick = () => {
    const state = getState();
    if (!openModal('削除済みの記録', renderTrashHtml(state.trash || []))) return;
    document.querySelectorAll('[data-restore-entry]').forEach(button => {
      button.onclick = async () => {
        const [type, id] = button.dataset.restoreEntry.split(':');
        setBusy(true, '復元中…');
        try {
          const data = await request({ action: 'restore', type, id });
          if (typeof globalThis.applyBootstrap === 'function') globalThis.applyBootstrap(data);
          else document.querySelector('#syncBtn')?.click();
          closeModal();
          notify('復元しました');
        } catch (error) {
          notify(error.message);
        } finally {
          setBusy(false);
        }
      };
    });
  };

  return true;
}
