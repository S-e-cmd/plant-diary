import assert from 'node:assert/strict';
import { createLogRuntime } from '../client/log-runtime.js';

const state = {
  cursor: new Date('2026-08-19T12:00:00+09:00'),
  view: 'day',
  search: { q: '', start: '', end: '', type: '', status: '', category: '', special: '' },
  logSort: 'desc',
  logPage: 1,
  logPageSize: 2
};
const runtime = createLogRuntime(() => state, () => '2026-08-19');

assert.deepEqual(runtime.dateRange(), {
  start: '2026-08-19',
  end: '2026-08-19',
  label: new Date('2026-08-19T12:00:00+09:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
});
assert.equal(runtime.dayDistance({ date: '2026-08-18' }), '1日超過');
assert.equal(runtime.planTiming({ date: '2026-08-19' }), 'today');

const actuals = [
  { id: 'a1', type: 'actual', date: '2026-08-19', action: '水やり' },
  { id: 'a2', type: 'actual', date: '2026-08-18', action: '除草' }
];
const plans = [
  { id: 'p1', type: 'plan', date: '2026-08-19', action: '消毒', pesticide: '薬剤A', status: '未完了' },
  { id: 'p2', type: 'plan', date: '2026-08-19', action: '液肥', liquidFertilizer: '液肥A', status: '未完了' }
];

let list = runtime.buildLogList(actuals, plans);
assert.equal(list.searchActive, false);
assert.deepEqual(list.items.map(x => x.id), ['a1', 'p1', 'p2']);
assert.equal(list.pages, 2);
assert.equal(list.page, 1);
assert.deepEqual(list.pageItems.map(x => x.id), ['a1', 'p1']);

state.search = { q: '', start: '', end: '', type: 'plan', status: '', category: '', special: 'spray' };
list = runtime.buildLogList(actuals, plans);
assert.equal(list.searchActive, true);
assert.deepEqual(list.items.map(x => x.id), ['p1']);

state.search = { q: '', start: '', end: '', type: '', status: '', category: '', special: '' };
state.view = 'week';
assert.deepEqual(runtime.dateRange(), {
  start: '2026-08-17',
  end: '2026-08-23',
  label: `${new Date('2026-08-17T12:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}〜${new Date('2026-08-23T12:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}`
});

console.log('ok - log runtime boundary');
