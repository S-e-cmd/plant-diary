import assert from 'node:assert/strict';
import { ISO_DATE_PATTERN, isValidIsoDate } from '../shared/iso-date.js';

assert.equal(ISO_DATE_PATTERN.test('2026-08-19'), true);
assert.equal(isValidIsoDate('2026-08-19'), true);
assert.equal(isValidIsoDate('2024-02-29'), true);
assert.equal(isValidIsoDate('2026-02-29'), false);
assert.equal(isValidIsoDate('2026-02-30'), false);
assert.equal(isValidIsoDate('2026-04-31'), false);
assert.equal(isValidIsoDate('2026-12-31'), true);
assert.equal(isValidIsoDate('2026-13-01'), false);
assert.equal(isValidIsoDate('2026-00-10'), false);
assert.equal(isValidIsoDate('2026-8-19'), false);
assert.equal(isValidIsoDate(''), false);
assert.equal(isValidIsoDate(null), false);

console.log('ok - shared ISO date validation contract');
