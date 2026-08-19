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
  normalizeApiPayload({ action: 'postponePlan', id: 'p1', date: '2026-08-21' }),
  { action: 'postponePlan', id: 'p1', date: '2026-08-21' }
);

for (const date of [undefined, '', '2026-8-21', '2026-02-29']) {
  assert.throws(
    () => normalizeApiPayload({ action: 'postponePlan', id: 'p1', date }),
    error => error instanceof ApiContractError && error.message === '延期には有効な延期後の日付（YYYY-MM-DD）が必要です。'
  );
}

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'complete' }),
  { action: 'batchPlans', ids: ['p1'], operation: 'complete', kind: 'complete' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: [' p1 ', '', 'p1', 'p2', '  '], operation: 'complete' }),
  { action: 'batchPlans', ids: ['p1', 'p2'], operation: 'complete', kind: 'complete' }
);

for (const ids of [undefined, null, '', 'p1', {}, 1]) {
  assert.throws(
    () => normalizeApiPayload({ action: 'bulkPlans', ids, operation: 'complete' }),
    error => error instanceof ApiContractError && error.message === '一括操作には対象IDの配列が必要です。'
  );
}

for (const ids of [[], ['', ' '], [null, undefined, '']]) {
  assert.throws(
    () => normalizeApiPayload({ action: 'bulkPlans', ids, operation: 'complete' }),
    error => error instanceof ApiContractError && error.message === '一括操作には1件以上の対象IDが必要です。'
  );
}

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21' }),
  { action: 'batchPlans', ids: ['p1'], operation: 'postpone', date: '2026-08-21', kind: 'postpone' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], kind: 'cancel' }),
  { action: 'batchPlans', ids: ['p1'], kind: 'cancel' }
);

for (const operation of [undefined, '', ' ', 'finish', 'delete', 'Complete']) {
  assert.throws(
    () => normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation }),
    error => error instanceof ApiContractError && error.message === '一括操作はcomplete、postpone、cancelのいずれかを指定してください。'
  );
}

for (const date of [undefined, '', '2026-8-21', '2026-02-29']) {
  assert.throws(
    () => normalizeApiPayload({ action: 'bulkPlans', ids: ['p1'], operation: 'postpone', date }),
    error => error instanceof ApiContractError && error.message === '一括延期には有効な延期後の日付（YYYY-MM-DD）が必要です。'
  );
}

for (const action of ['update', 'delete', 'restore', 'postponePlan', 'cancelPlan', 'calendar', 'syncPlanCalendar', 'completePlan', 'skipRotation']) {
  for (const id of [undefined, '', '   ']) {
    assert.throws(
      () => normalizeApiPayload({
        action,
        id,
        type: ['update', 'delete', 'restore'].includes(action) ? 'actual' : undefined,
        patch: action === 'update' ? { action: '水やり' } : undefined,
        entry: action === 'completePlan' ? { type: 'actual', action: '水やり' } : undefined,
        date: action === 'postponePlan' ? '2026-08-21' : undefined
      }),
      error => error instanceof ApiContractError && error.message === `${action}には対象IDが必要です。`
    );
  }
}

for (const action of ['update', 'delete', 'restore']) {
  for (const type of [undefined, '', ' ', 'other', 'Actual', 'PLAN']) {
    assert.throws(
      () => normalizeApiPayload({ action, id: 'x1', type, patch: action === 'update' ? { action: '水やり' } : undefined }),
      error => error instanceof ApiContractError && error.message === `${action}のtypeはactualまたはplanで指定してください。`
    );
  }
}

for (const patch of [undefined, null, '', '水やり', [], {}, 0, false]) {
  assert.throws(
    () => normalizeApiPayload({ action: 'update', type: 'actual', id: 'a1', patch }),
    error => error instanceof ApiContractError && error.message === 'updateには空でないpatchオブジェクトが必要です。'
  );
}

const validEntries = [
  { type: 'actual', action: '水やり', date: '2026-08-19' },
  { type: 'plan', action: '消毒', date: '2026-08-20' }
];
assert.deepEqual(
  normalizeApiPayload({ action: 'save', entries: validEntries }),
  { action: 'save', entries: validEntries }
);
assert.deepEqual(
  normalizeApiPayload({ action: 'checkDuplicates', entries: validEntries }),
  { action: 'checkDuplicates', entries: validEntries }
);

for (const action of ['save', 'checkDuplicates']) {
  for (const entries of [undefined, null, '', {}, 1]) {
    assert.throws(
      () => normalizeApiPayload({ action, entries }),
      error => error instanceof ApiContractError && error.message === `${action}にはentries配列が必要です。`
    );
  }
  assert.throws(
    () => normalizeApiPayload({ action, entries: [] }),
    error => error instanceof ApiContractError && error.message === `${action}には1件以上のentryが必要です。`
  );
  for (const entry of [null, '', [], {}]) {
    assert.throws(
      () => normalizeApiPayload({ action, entries: [entry] }),
      error => error instanceof ApiContractError && error.message === `${action}の各entryは空でないオブジェクトで指定してください。`
    );
  }
  for (const type of [undefined, '', 'other', 'Actual']) {
    assert.throws(
      () => normalizeApiPayload({ action, entries: [{ type, action: '水やり' }] }),
      error => error instanceof ApiContractError && error.message === `${action}の各entry.typeはactualまたはplanで指定してください。`
    );
  }
  for (const work of [undefined, '', '   ']) {
    assert.throws(
      () => normalizeApiPayload({ action, entries: [{ type: 'actual', action: work }] }),
      error => error instanceof ApiContractError && error.message === `${action}の各entryには作業内容が必要です。`
    );
  }
}

for (const entry of [undefined, null, '', [], {}, 0, false]) {
  assert.throws(
    () => normalizeApiPayload({ action: 'completePlan', id: 'p1', entry }),
    error => error instanceof ApiContractError && error.message === 'completePlanには空でないentryオブジェクトが必要です。'
  );
}

assert.deepEqual(
  normalizeApiPayload({ action: 'skipRotation', id: 'p1' }),
  { action: 'skipRotation', id: 'p1' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'completePlan', id: 'p1', entry: { type: 'actual', action: '水やり' } }),
  { action: 'completePlan', id: 'p1', entry: { type: 'actual', action: '水やり' } }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'update', type: 'actual', id: 'a1', patch: { action: '水やり' } }),
  { action: 'update', type: 'actual', id: 'a1', patch: { action: '水やり' } }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'delete', type: 'plan', id: 'p1' }),
  { action: 'delete', type: 'plan', id: 'p1' }
);

assert.deepEqual(
  normalizeApiPayload({ action: 'restore', type: 'plan', id: 'p1' }),
  { action: 'restore', type: 'plan', id: 'p1' }
);

assert.equal(normalizeApiBody('not-json'), 'not-json');
assert.equal(
  normalizeApiBody(JSON.stringify({ action: 'calendar', id: 'p1' })),
  JSON.stringify({ action: 'syncPlanCalendar', id: 'p1' })
);

console.log('ok - API action normalization contract');
