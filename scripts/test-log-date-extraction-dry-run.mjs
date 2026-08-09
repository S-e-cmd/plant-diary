import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import {
  transformLogDateExtraction,
  newBuild,
  oldDateRange,
  oldDayDistance,
  oldPlanTiming,
  newStartup
} from './log-date-extraction-transform.mjs';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const alreadySwitched = html.includes(newBuild) && html.includes("import('./client/log-date-utils.js')");
const transformed = alreadySwitched ? html : transformLogDateExtraction(html);

if (!alreadySwitched) {
  assert.notEqual(transformed, html, 'log date extraction dry-run must change the staged client');
}
assert.ok(transformed.includes(newBuild), 'dry-run result must contain the new client build marker');
assert.ok(!transformed.includes(oldDateRange), 'dry-run result must remove inline dateRange');
assert.ok(!transformed.includes(oldDayDistance), 'dry-run result must remove inline dayDistance');
assert.ok(!transformed.includes(oldPlanTiming), 'dry-run result must remove inline planTiming');
assert.ok(transformed.includes("import('./client/log-date-utils.js')"), 'dry-run result must load log-date-utils.js');
assert.ok(transformed.includes(newStartup), 'startup must initialize log date runtime with existing runtimes');

const inlineScripts = [...transformed.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
assert.ok(inlineScripts.length > 0, 'transformed inline client script must exist');
for (const [index, source] of inlineScripts.entries()) {
  new vm.Script(source, { filename: `log-date-dry-run-${index + 1}.js` });
}

console.log(`log date extraction dry-run: ok (${alreadySwitched ? 'switched' : 'staged'})`);
