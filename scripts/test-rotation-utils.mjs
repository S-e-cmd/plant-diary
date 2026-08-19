import assert from 'node:assert/strict';
import {
  isRotationPlan,
  activeRotationPlans,
  rotationActuals,
  rotationNames,
  normalizeMonthDay,
  shouldOfferSeasonStart,
  rotationViewModel,
  needsNextCycle
} from '../client/rotation-utils.js';

const base = {
  type: 'plan',
  rotationName: '7月以降ダリアローテーション',
  cyclic: true,
  status: '未完了'
};

assert.equal(isRotationPlan({ ...base, rotationOrder: 1 }), true);
assert.equal(isRotationPlan({ ...base, rotationOrder: 0 }), false);
assert.equal(isRotationPlan({ ...base, type: 'actual', rotationOrder: 1 }), false);

const plans = [
  { ...base, id: 'r1', rotationOrder: 1 },
  { ...base, id: 'r2', rotationOrder: 2, status: '完了' },
  { ...base, id: 'r3', rotationOrder: 3 },
  { ...base, id: 'r4', rotationOrder: 4, status: '中止' },
  { type: 'plan', id: 'normal', status: '未完了', rotationName: '', rotationOrder: 0 }
];

assert.deepEqual(activeRotationPlans(plans).map(x => x.id), ['r1', 'r3']);
assert.deepEqual(rotationNames(plans), [base.rotationName]);

const actuals = [
  { id: 'a2', rotationName: base.rotationName, date: '2026-08-18' },
  { id: 'other', rotationName: '別ローテーション', date: '2026-08-01' },
  { id: 'a1', rotationName: base.rotationName, date: '2026-07-20' }
];
assert.deepEqual(rotationActuals(actuals, base.rotationName).map(x => x.id), ['a1', 'a2']);

const model = rotationViewModel(plans, actuals);
assert.equal(model.mode, 'active');
assert.equal(model.current.id, 'r1');
assert.equal(model.next.id, 'r3');
assert.equal(model.after.id, 'r3');
assert.equal(model.total, 12);
assert.equal(model.count, 1);
assert.equal(model.done, 2);
assert.deepEqual(model.rows.map(x => x.id), ['r1', 'r3']);

assert.equal(normalizeMonthDay('07-01'), '07-01');
assert.equal(normalizeMonthDay('02-30'), '07-01');
assert.equal(shouldOfferSeasonStart({ state: 'ended', endedYear: 2026, startMonthDay: '07-01' }, '2027-06-30'), false);
assert.equal(shouldOfferSeasonStart({ state: 'ended', endedYear: 2026, startMonthDay: '07-01' }, '2027-07-01'), true);
assert.equal(shouldOfferSeasonStart({ state: 'ended', endedYear: 2026, startMonthDay: '07-01' }, '2026-08-19'), false);

const endedPlans = plans.map(x => x.rotationName === base.rotationName ? { ...x, status: x.id === 'normal' ? x.status : '中止' } : x);
assert.equal(rotationViewModel(endedPlans, actuals, 12, {
  seasons: { [base.rotationName]: { state: 'ended', endedYear: 2026, startMonthDay: '07-01' } },
  today: '2026-08-19'
}), null);

const startModel = rotationViewModel(endedPlans, actuals, 12, {
  seasons: { [base.rotationName]: { state: 'ended', endedYear: 2026, startMonthDay: '07-01' } },
  today: '2027-07-01'
});
assert.equal(startModel.mode, 'start');
assert.equal(startModel.rotationName, base.rotationName);
assert.equal(startModel.startMonthDay, '07-01');

assert.equal(needsNextCycle([
  { ...base, rotationOrder: 1, status: '完了' },
  { ...base, rotationOrder: 2, status: '完了' }
], base.rotationName), true);

assert.equal(needsNextCycle([
  { ...base, rotationOrder: 1, status: '完了' },
  { ...base, rotationOrder: 2, status: '未完了' }
], base.rotationName), false);

assert.equal(needsNextCycle([
  { ...base, rotationOrder: 1, status: '完了', cyclic: false }
], base.rotationName), false);

console.log('rotation utils: ok');
