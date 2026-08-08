import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function ok(name) {
  console.log(`ok - ${name}`);
}

function required(pattern, message) {
  assert.match(html, pattern, message);
  ok(message);
}

const scriptBlocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());

assert.ok(scriptBlocks.length > 0, 'inline client script was not found');

for (const [index, source] of scriptBlocks.entries()) {
  new vm.Script(source, { filename: `index.html:inline-script-${index + 1}.js` });
}
ok('inline client JavaScript parses successfully');

required(/const\s+API_URL\s*=\s*['"]\/api['"]\s*;/, 'same-origin /api contract is present');
required(/plantDiaryCollapsed/, 'collapsed-state storage key is present');
required(/plantDiaryQuickFavorites/, 'quick-favorites storage key is present');
required(/plantDiaryInputDraft/, 'input-draft storage key is present');
required(/plantDiarySavedSearches/, 'saved-search storage key is present');

for (const id of [
  'syncBtn',
  'pinned',
  'weather',
  'tomorrowWeather',
  'workWindow',
  'tab-today',
  'tab-input',
  'tab-logs',
  'tab-plans',
  'modal',
  'processing'
]) {
  required(new RegExp(`id=["']${id}["']`), `required DOM id ${id} is present`);
}

console.log(`checked ${scriptBlocks.length} inline script block(s)`);
