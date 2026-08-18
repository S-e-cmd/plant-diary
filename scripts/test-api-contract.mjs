import assert from 'node:assert/strict';
import { ApiContractError, normalizeApiBody, normalizeApiPayload } from '../worker/api-contract.js';

assert.deepEqual(
  normalizeApiPayload({ action: 'parse', type: 'plan', date: '2026-08-19', rawText: 'ダリア消毒' }),
  {
    action: 'analyze',
    type: 'plan',
    date: '2026-08-19',
    rawText: 'ダリア消毒',
    text: 'ダリア消毒',
    inputType: 'plan'
  }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'calendar', id: 'p1' }),
  { action: 'syncPlanCalendar', id: 'p1' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'calendarBulk', ids: ['p1', 'p2'] }),
  { action: 'syncAllPlansCalendar' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'complete' }),
  { action: 'batchPlans', ids: ['p1'], operation: 'complete', kind: 'complete' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21' }),
  { action: 'batchPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21', kind: 'postpone' }
);

for (const date of [undefined, '', '2026-8-21', '2026-02-29']) {
  assert.throws(
    () => normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'postpone', date }),
    error => error instanceof ApiContractError && error.message === '一括延期には有効な延期後の日付（YYYY-MM-DD）が必要です。'
  );
}

assert.deepEqual(
  normalizeApiPayload({ action: 'skipRotation', id: 'p1' }),
  { action: 'skipRotation', id: 'p1' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'completePlan', id: 'p1' }),
  { action: 'completePlan', id: 'p1' }
);

assert.equal(normalizeApiBody('not-json'), 'not-json');
assert.equal(
  normalizeApiBody(JSON.stringify({ action: 'calendar', id: 'p1' })),
  JSON.stringify({ action: 'syncPlanCalendar', id: 'p1' })
);

console.log('ok - API action normalization contract');
