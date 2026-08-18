import assert from 'node:assert/strict';
import { createRotationRuntime } from '../client/rotation-runtime.js';

const state = {
  plans: [
    { id: 'p1', type: 'plan', rotationName: 'ダリア', rotationOrder: 1, status: '完了', cyclic: true },
    { id: 'p2', type: 'plan', rotationName: 'ダリア', rotationOrder: 2, status: '未完了', cyclic: true },
    { id: 'p3', type: 'plan', rotationName: 'ダリア', rotationOrder: 3, status: '未完了', cyclic: true }
  ],
  actuals: [
    { id: 'a1', rotationName: 'ダリア', date: '2026-08-18' },
    { id: 'a2', rotationName: 'ダリア', date: '2026-08-19' }
  ]
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
assert.equal(runtime.needsNextCycle('ダリア'), false);

state.plans[1].status = '完了';
state.plans[2].status = '中止';
assert.equal(runtime.viewModel(), null);
assert.equal(runtime.needsNextCycle('ダリア'), true);

console.log('ok - rotation runtime boundary');
