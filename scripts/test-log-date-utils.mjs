process.env.TZ = 'Asia/Tokyo';

import assert from 'node:assert/strict';
import { dateRange, dayDistance, planTiming } from '../client/log-date-utils.js';

const cursor = new Date('2026-08-09T12:00:00+09:00');

assert.deepEqual(dateRange(cursor, 'day'), {
  start: '2026-08-09',
  end: '2026-08-09',
  label: '2026年8月9日(日)'
});

assert.deepEqual(dateRange(cursor, 'week'), {
  start: '2026-08-03',
  end: '2026-08-09',
  label: '8/3(月)〜8/9(日)'
});

assert.deepEqual(dateRange(cursor, 'month'), {
  start: '2026-08-01',
  end: '2026-08-31',
  label: '2026年8月'
});

assert.equal(dayDistance({ endDate: '2026-08-08', date: '2026-08-20', startDate: '2026-08-01' }, '2026-08-09'), '1日超過');
assert.equal(dayDistance({ date: '2026-08-09' }, '2026-08-09'), '今日');
assert.equal(dayDistance({ startDate: '2026-08-12' }, '2026-08-09'), 'あと3日');
assert.equal(dayDistance({}, '2026-08-09'), '');

assert.equal(planTiming({}, '2026-08-09'), 'undated');
assert.equal(planTiming({ date: '2026-08-08' }, '2026-08-09'), 'overdue');
assert.equal(planTiming({ date: '2026-08-09' }, '2026-08-09'), 'today');
assert.equal(planTiming({ startDate: '2026-08-08', endDate: '2026-08-10' }, '2026-08-09'), 'today');
assert.equal(planTiming({ date: '2026-08-10' }, '2026-08-09'), 'future');

console.log('log date utils: ok');
