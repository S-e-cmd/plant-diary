import assert from 'node:assert/strict';
import { ApiContractError, normalizeApiBody, normalizeApiPayload } from '../worker/api-contract.js';

for (const payload of [
  {},
  { action: '' },
  { action: 'unknownAction' },
  { action: 'deleteEverything' }
]) {
  assert.throws(
    () => normalizeApiPayload(payload),
    error => error instanceof ApiContractError && error.message === '未対応の操作です。'
  );
}

assert.deepEqual(
  normalizeApiPayload({ action: 'batchPlans', ids: [' p1 ', 'p1', 'p2'], kind: 'complete' }),
  { action: 'batchPlans', ids: ['p1', 'p2'], kind: 'complete' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'batchPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21' }),
  { action: 'batchPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21', kind: 'postpone' }
);

for (const payload of [
  { action: 'batchPlans', ids: [], kind: 'complete' },
  { action: 'batchPlans', ids: ['p1'], kind: 'finish' },
  { action: 'batchPlans', ids: ['p1'], kind: 'postpone', date: '2026-02-29' }
]) {
  assert.throws(
    () => normalizeApiPayload(payload),
    error => error instanceof ApiContractError
  );
}

assert.equal(normalizeApiBody('not-json'), 'not-json');
assert.equal(
  normalizeApiBody(JSON.stringify({ action: 'bootstrap' })),
  JSON.stringify({ action: 'bootstrap' })
);

console.log('ok - final Worker API boundary');
