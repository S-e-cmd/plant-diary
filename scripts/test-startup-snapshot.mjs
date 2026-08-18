import assert from 'node:assert/strict';
import {
  STARTUP_SNAPSHOT_KEY,
  buildStartupSnapshot,
  isUsableStartupSnapshot,
  readStartupSnapshot,
  writeStartupSnapshot
} from '../client/startup-snapshot.js';

const today = '2026-08-19';
const actuals = Array.from({ length: 40 }, (_, index) => ({
  id: `a${index}`,
  type: 'actual',
  date: `2026-08-${String(19 - Math.min(index, 18)).padStart(2, '0')}`,
  action: `作業${index}`,
  rotationName: index === 39 ? 'ダリア' : ''
}));
const plans = [
  { id: 'p1', status: '未完了' },
  { id: 'p2', status: '延期' },
  { id: 'p3', status: '完了' },
  { id: 'p4', status: '中止' }
];
const source = { actuals, plans, pinned: { overdueCount: 1 }, masters: { plants: ['牡丹'] } };
const snapshot = buildStartupSnapshot(source, today);

assert.equal(snapshot.version, 1);
assert.equal(snapshot.today, today);
assert.deepEqual(snapshot.data.plans.map(x => x.id), ['p1', 'p2']);
assert.ok(snapshot.data.actuals.some(x => x.id === 'a39'), 'rotation history must survive the recent-record cap');
assert.ok(snapshot.data.actuals.length >= 30);
assert.deepEqual(snapshot.data.trash, []);
assert.deepEqual(snapshot.data.summaries, { daily: [], weekly: [], monthly: [] });
assert.equal(isUsableStartupSnapshot(snapshot, today), true);
assert.equal(isUsableStartupSnapshot(snapshot, '2026-08-20'), false);

const values = new Map();
const storage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); }
};
assert.equal(writeStartupSnapshot(storage, source, today), true);
assert.ok(values.has(STARTUP_SNAPSHOT_KEY));
assert.equal(readStartupSnapshot(storage, today).plans.length, 2);
assert.equal(readStartupSnapshot(storage, '2026-08-20'), null);

console.log('ok - startup snapshot contract');
