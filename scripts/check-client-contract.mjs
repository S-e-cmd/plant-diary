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

function requiredFunction(name) {
  required(
    new RegExp(`function\\s+${name}\\s*\\(`),
    `client function ${name} is present`
  );
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

for (const key of [
  'plantDiaryCollapsed',
  'plantDiaryQuickFavorites',
  'plantDiaryInputDraft',
  'plantDiarySavedSearches',
  'plantDiaryLastTab'
]) {
  required(new RegExp(key), `LocalStorage contract ${key} is present`);
}

for (const id of [
  'syncBtn',
  'pinned',
  'weather',
  'tomorrowWeather',
  'weatherAlert',
  'workWindow',
  'weekForecast',
  'tab-today',
  'tab-input',
  'tab-logs',
  'tab-plans',
  'quickInputList',
  'logsList',
  'plansList',
  'modal',
  'modalBody',
  'processing'
]) {
  required(new RegExp(`id=["']${id}["']`), `required DOM id ${id} is present`);
}

for (const name of [
  'forecastWeatherName',
  'weatherRule',
  'forecastRain',
  'forecastStrongWind',
  'weatherWorkRisk',
  'riskReason',
  'isWeatherSensitivePlan',
  'planWeatherKind',
  'safeWindows',
  'renderForecasts',
  'renderWorkWindows',
  'applyBootstrap',
  'renderActiveTab'
]) {
  requiredFunction(name);
}

required(
  /weatherRules:\{spray:\{rain:0\.5,rainProbability:40,wind:5\},liquid:\{rain:0\.5,rainProbability:40,wind:5\}\}/,
  'default weather-rule thresholds are preserved'
);
required(
  /fetch\(API_URL,\{method:'POST',headers:\{'Content-Type':'application\/json'\}/,
  'client API request method and content type are preserved'
);
required(
  /action:'bootstrap'/,
  'bootstrap API action remains present'
);
required(
  /applyBootstrap\(d\)/,
  'bootstrap response application remains present'
);

console.log(`checked ${scriptBlocks.length} inline script block(s)`);
