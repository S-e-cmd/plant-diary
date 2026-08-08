import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const indexPath = join(rootDir, 'index.html');
const clientDir = join(rootDir, 'client');
const html = await readFile(indexPath, 'utf8');

function ok(name) {
  console.log(`ok - ${name}`);
}

function required(source, pattern, message) {
  assert.match(source, pattern, message);
  ok(message);
}

async function readClientFiles() {
  try {
    const names = (await readdir(clientDir)).filter(name => name.endsWith('.js')).sort();
    return Promise.all(
      names.map(async name => ({ name: `client/${name}`, path: join(clientDir, name), source: await readFile(join(clientDir, name), 'utf8') }))
    );
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match, index) => ({ name: `index.html:inline-script-${index + 1}.js`, source: match[1] }))
  .filter(item => item.source.trim());

const clientFiles = await readClientFiles();
assert.ok(inlineScripts.length + clientFiles.length > 0, 'client JavaScript source was not found');

for (const item of inlineScripts) {
  new vm.Script(item.source, { filename: item.name });
}
for (const item of clientFiles) {
  const result = spawnSync(process.execPath, ['--check', item.path], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${item.name} failed module syntax check:\n${result.stderr || result.stdout}`);
}
ok('client JavaScript parses successfully');

const executableSources = [...inlineScripts, ...clientFiles];
const combinedClientSource = executableSources.map(item => item.source).join('\n');
const contractSource = `${html}\n${combinedClientSource}`;

required(contractSource, /const\s+API_URL\s*=\s*['"]\/api['"]\s*;/, 'same-origin /api contract is present');

for (const key of [
  'plantDiaryCollapsed',
  'plantDiaryQuickFavorites',
  'plantDiaryInputDraft',
  'plantDiarySavedSearches',
  'plantDiaryLastTab'
]) {
  required(contractSource, new RegExp(key), `LocalStorage contract ${key} is present`);
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
  required(html, new RegExp(`id=["']${id}["']`), `required DOM id ${id} is present`);
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
  required(
    combinedClientSource,
    new RegExp(`function\\s+${name}\\s*\\(`),
    `client function ${name} is present`
  );
}

required(
  combinedClientSource,
  /weatherRules:\{spray:\{rain:0\.5,rainProbability:40,wind:5\},liquid:\{rain:0\.5,rainProbability:40,wind:5\}\}/,
  'default weather-rule thresholds are preserved'
);
required(
  combinedClientSource,
  /fetch\(API_URL,\{method:'POST',headers:\{'Content-Type':'application\/json'\}/,
  'client API request method and content type are preserved'
);
required(combinedClientSource, /action:'bootstrap'/, 'bootstrap API action remains present');
required(combinedClientSource, /applyBootstrap\(d\)/, 'bootstrap response application remains present');

const runtimeWired = html.includes("import('./client/weather-runtime.js')");
if (runtimeWired) {
  required(html, /import\(['"]\.\/client\/weather-runtime\.js['"]\)/, 'weather runtime module is loaded by index.html');
  required(combinedClientSource, /from ['"]\.\/weather-utils\.js['"]/, 'weather runtime imports weather-utils.js');
  required(
    html,
    /if\(savedDraft\)\{\$\$\('\[data-input-type\]'\)\.forEach\(/,
    'saved draft restoration still updates all input-type controls'
  );
}

console.log(`checked ${inlineScripts.length} inline script block(s) and ${clientFiles.length} client file(s)`);
