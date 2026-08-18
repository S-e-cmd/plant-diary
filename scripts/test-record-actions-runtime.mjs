import assert from 'node:assert/strict';
import { createRecordActionsRuntime } from '../client/record-actions-runtime.js';

const state = {
  actuals: [{ id: 'a1', type: 'actual', action: '水やり', memo: '旧' }],
  plans: [{ id: 'p1', type: 'plan', action: '消毒', memo: '', calendarEventId: 'old' }],
  entries: [],
  inputType: 'plan',
  completingPlanId: ''
};
const calls = [];
const notices = [];
const nodes = new Map([
  ['#editAction', { value: '剪定' }],
  ['#editMemo', { value: '更新' }],
  ['#saveEdit', { onclick: null }]
]);
let tab = '';
let previewCount = 0;
let draftCount = 0;
let modal = null;

const runtime = createRecordActionsRuntime({
  getState: () => state,
  api: async payload => { calls.push(payload); return { refreshed: true }; },
  applyBootstrap: data => { calls.push({ applied: data }); },
  busy: () => {},
  toast: message => notices.push(message),
  showTab: value => { tab = value; },
  renderPreview: () => { previewCount += 1; },
  saveDraft: () => { draftCount += 1; },
  localDate: () => '2026-08-19',
  escapeHtml: value => String(value ?? ''),
  openModal: (title, html) => { modal = { title, html }; },
  closeModal: () => { modal = null; },
  promptFn: () => '2026-08-21',
  confirmFn: () => true,
  query: selector => nodes.get(selector),
  makeId: () => 'generated-id'
});

runtime.reuseEntry('actual', 'a1');
assert.equal(tab, 'input');
assert.equal(state.inputType, 'actual');
assert.equal(state.entries[0].clientId, 'generated-id');
assert.equal(state.entries[0].date, '2026-08-19');
assert.equal(state.entries[0].id, '');
assert.equal(previewCount, 1);
assert.equal(draftCount, 1);

runtime.openComplete('p1');
assert.equal(state.completingPlanId, 'p1');
assert.equal(state.entries[0].calendarEventId, '');

await runtime.openPostpone('p1');
assert.deepEqual(calls.at(-2), { action: 'postponePlan', id: 'p1', date: '2026-08-21' });

await runtime.cancelPlan('p1');
assert.deepEqual(calls.at(-2), { action: 'cancelPlan', id: 'p1' });

await runtime.syncCalendar('p1');
assert.deepEqual(calls.at(-2), { action: 'calendar', id: 'p1' });

await runtime.skipRotation('p1');
assert.deepEqual(calls.at(-2), { action: 'skipRotation', id: 'p1' });

await runtime.removeEntry('actual', 'a1');
assert.deepEqual(calls.at(-2), { action: 'delete', type: 'actual', id: 'a1' });

runtime.openEdit('actual', 'a1');
assert.equal(modal.title, '編集');
assert.match(modal.html, /editAction/);
await nodes.get('#saveEdit').onclick();
assert.deepEqual(calls.at(-2), {
  action: 'update',
  type: 'actual',
  id: 'a1',
  patch: { action: '剪定', memo: '更新' }
});
assert.ok(notices.includes('更新しました'));

console.log('ok - record actions runtime');
