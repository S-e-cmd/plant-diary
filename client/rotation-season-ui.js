import { requestApi } from './api-client.js';

function monthDayLabel_(value) {
  const [month, day] = String(value || '07-01').split('-').map(Number);
  return `${month}月${day}日`;
}

export function installRotationSeasonUi({ getState, getModel }) {
  if (typeof document === 'undefined') return;
  if (typeof getState !== 'function' || typeof getModel !== 'function') return;
  if (globalThis.__plantDiaryRotationSeasonUiInstalled) return;
  globalThis.__plantDiaryRotationSeasonUiInstalled = true;

  let mutating = false;

  async function mutate_(payload, message) {
    if (mutating) return;
    mutating = true;
    try {
      await requestApi(payload);
      globalThis.location?.reload?.();
    } catch (error) {
      globalThis.alert?.(error?.message || message);
      mutating = false;
    }
  }

  function render_() {
    const todayList = document.querySelector('#todayList');
    if (!todayList) return;
    const model = getModel();

    todayList.querySelectorAll('[data-rotation-season-prompt]').forEach(node => node.remove());

    if (!model?.seasonCapable) return;

    if (model.mode === 'start') {
      const card = document.createElement('div');
      card.className = 'card rotation-card';
      card.dataset.rotationSeasonPrompt = 'start';
      card.innerHTML = `<div class="rotation-head"><div><div class="pin-title">ダリア用ローテーション</div><div class="log-meta">今季の開始時期（${monthDayLabel_(model.startMonthDay)}以降）になりました</div></div></div><button class="primary" data-rotation-season-start>今季を開始</button>`;
      card.querySelector('[data-rotation-season-start]').onclick = () => {
        mutate_({ action: 'startRotationSeason', rotationName: model.rotationName }, '今季開始に失敗しました。');
      };
      todayList.prepend(card);
      return;
    }

    const rotationCard = todayList.querySelector('.rotation-card');
    if (!rotationCard || rotationCard.querySelector('[data-rotation-season-end]')) return;
    const wrap = document.createElement('div');
    wrap.dataset.rotationSeasonPrompt = 'end';
    wrap.className = 'rotation-actions';
    const button = document.createElement('button');
    button.className = 'secondary';
    button.dataset.rotationSeasonEnd = '';
    button.textContent = '今季のローテーションを終了';
    button.onclick = () => {
      if (!globalThis.confirm?.('今季のローテーションを終了しますか？\n残りの枠は今季終了として閉じ、来年の開始時期に再開案内を表示します。')) return;
      mutate_({
        action: 'endRotationSeason',
        rotationName: model.rotationName,
        startMonthDay: model.startMonthDay || '07-01'
      }, '今季終了に失敗しました。');
    };
    wrap.append(button);
    rotationCard.append(wrap);
  }

  const observer = new MutationObserver(() => queueMicrotask(render_));
  const target = document.querySelector('#todayList');
  if (target) observer.observe(target, { childList: true, subtree: true });
  queueMicrotask(render_);
}
