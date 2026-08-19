import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const clientSource = await readFile(join(rootDir, 'client/plan-bulk-utils.js'), 'utf8');
const workerSource = await readFile(join(rootDir, 'worker/api-contract.js'), 'utf8');
const sharedSource = await readFile(join(rootDir, 'shared/iso-date.js'), 'utf8');

assert.match(clientSource, /from ['"]\.\.\/shared\/iso-date\.js['"]/, 'client bulk-plan validation must use shared ISO date module');
assert.match(workerSource, /from ['"]\.\.\/shared\/iso-date\.js['"]/, 'Worker API validation must use shared ISO date module');
assert.match(sharedSource, /export function isValidIsoDate\s*\(/, 'shared ISO date validator must remain exported');
assert.doesNotMatch(clientSource, /Date\.UTC\(/, 'client bulk-plan module must not recreate calendar validation');
assert.doesNotMatch(workerSource, /Date\.UTC\(/, 'Worker API contract must not recreate calendar validation');
assert.doesNotMatch(clientSource, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/, 'client bulk-plan module must not recreate ISO date regex');
assert.doesNotMatch(workerSource, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/, 'Worker API contract must not recreate ISO date regex');

console.log('ok - client and Worker share one ISO date validation contract');
