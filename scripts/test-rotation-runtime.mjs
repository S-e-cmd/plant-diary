import assert from 'node:assert/strict';
import { createRotationRuntime } from '../client/rotation-runtime.js';

const state = {
  plans: [
    { id: 'p1', type: 'plan', rotationName: 'ダリア', rotationOrder: 1, status: '完了', cyclic: true, rotationSeasonCapable: true },
    { id: 'p2', type: 'plan', rotationName: 'ダリア', rotationOrder: 2, status: '未完了', cyclic: true, rotationSeasonCapable: true },
    { id: 'p3', type: 'plan', rotationName: 'ダリア', rotationOrder: 3, status: '未完了', cyclic: true, rotationSeasonCapable: true }
  ],
  actuals: [
    { id: 'a1', rotationName: 'ダリア', date: '2026-08-18' },
    { id: 'a2', rotationName: 'ダリア', date: '2026-08-19' }
  ],
  today: '2026-08-19'
};

const runtime = createRotationRuntime(() => state);
assert.equal(runtime.isRotationPlan(state.plans[1]), true);

let vm = runtime.viewModel();
assert.equal(vm.current.id, 'p2');
assert.equal(vm.next.id, 'p3');
assert.equal(vm.after.id, 'p3');
assert.equal(vm.count, 2);
assert.equal(vm.total, 12);
assert.equal(vm.done, 2);
assert.equal(vm.seasonCapable, true);
assert.equal(runtime.needsNextCycle('ダリア'), false);

state.plans = state.plans.map(item => ({
  ...item,
  status: '中止',
  rotationSeasonState: 'ended',
  rotationSeasonYear: 2026,
  rotationStartMonthDay: '07-01',
  updatedAt: '2026-08-19T01:00:00.000Z'
}));
assert.equal(runtime.viewModel(), null);
assert.equal(runtime.seasonViewModel(), null);

state.today = '2027-07-01';
const start = runtime.seasonViewModel();
assert.equal(start.mode, 'start');
assert.equal(start.rotationName, 'ダリア');
assert.equal(start.startMonthDay, '07-01');
assert.equal(start.seasonCapable, true);

console.log('ok - rotation runtime boundary');
