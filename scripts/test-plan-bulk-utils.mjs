import assert from 'node:assert/strict';
import { buildBulkPlanRequest, isValidIsoDate, normalizePlanIds } from '../client/plan-bulk-utils.js';

assert.deepEqual(normalizePlanIds(['p1', ' p1 ', '', null, 'p2']), ['p1', 'p2']);
assert.equal(isValidIsoDate('2026-08-19'), true);
assert.equal(isValidIsoDate('2026-02-29'), false);
assert.equal(isValidIsoDate('2026-8-19'), false);

assert.deepEqual(
  buildBulkPlanRequest('complete', ['p1', 'p2']),
  { action: 'bulkPlans', ids: ['p1', 'p2'], operation: 'complete' }
);
assert.deepEqual(
  buildBulkPlanRequest('cancel', ['p1']),
  { action: 'bulkPlans', ids: ['p1'], operation: 'cancel' }
);
assert.deepEqual(
  buildBulkPlanRequest('postpone', ['p1'], '2026-08-25'),
  { action: 'bulkPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-25' }
);

assert.throws(() => buildBulkPlanRequest('postpone', ['p1']), /延期後の日付/);
assert.throws(() => buildBulkPlanRequest('postpone', ['p1'], '2026-02-29'), /延期後の日付/);
assert.throws(() => buildBulkPlanRequest('complete', []), /予定を選択/);
assert.throws(() => buildBulkPlanRequest('unknown', ['p1']), /未対応の一括操作/);

console.log('ok - bulk plan request contract');
