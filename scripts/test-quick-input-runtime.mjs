import assert from 'node:assert/strict';
import { createQuickInputRuntime } from '../client/quick-input-runtime.js';

const state = {
  quickFavorites: [{ qid: 'f1', action: '消毒', plantName: 'ダリア', pesticide: '薬剤A' }],
  actuals: [
    { id: 'a1', date: '2026-08-19', action: '液肥', plantName: 'ダリア', liquidFertilizer: '液肥A' },
    { id: 'a2', date: '2026-08-18', action: '消毒', plantName: 'ダリア', pesticide: '薬剤A' },
    { id: 'a3', date: '2026-08-17', action: '除草', plantName: '牡丹' }
  ]
};
let id = 0;
const runtime = createQuickInputRuntime(() => state, () => `q${++id}`);

assert.equal(runtime.isFavorite(state.actuals[1]), true);
assert.equal(runtime.isFavorite(state.actuals[0]), false);

const groups = runtime.buildGroups();
assert.deepEqual(groups.favorites.map(x => x.qid), ['f1']);
assert.deepEqual(groups.recent.map(x => x.id), ['a1', 'a3']);

const added = runtime.toggleFavorite(state.actuals[0]);
assert.equal(added.added, true);
assert.equal(state.quickFavorites[0].qid, 'q1');
assert.equal(runtime.isFavorite(state.actuals[0]), true);

const removed = runtime.toggleFavorite(state.actuals[0]);
assert.equal(removed.added, false);
assert.equal(runtime.isFavorite(state.actuals[0]), false);

const template = runtime.quickTemplate({ action: '水やり', category: '' });
assert.equal(template.qid, 'q2');
assert.equal(template.action, '水やり');
assert.equal(template.category, 'その他');

console.log('ok - quick input runtime boundary');
