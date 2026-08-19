import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const indexPath = join(rootDir, 'index.html');
const stylesheetPath = join(rootDir, 'styles.css');
const clientDir = join(rootDir, 'client');
const html = await readFile(indexPath, 'utf8');
const stylesheet = await readFile(stylesheetPath, 'utf8');

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

required(html, /<link\s+rel=["']stylesheet["']\s+href=["']\.\/styles\.css["']\s*\/?>/i, 'external stylesheet is loaded by index.html');
assert.doesNotMatch(html, /<style(?:\s[^>]*)?>[\s\S]*?<\/style>/i, 'index.html must not recreate application stylesheet inline');
ok('index.html does not recreate application stylesheet inline');
for (const selector of [':root', '.app', '.rotation-card', '.log-card', '.forecast-strip']) {
  assert.ok(stylesheet.includes(selector), `styles.css is missing required selector ${selector}`);
}
ok('styles.css contains representative application selectors');

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
required(html, /["']&quot;["']/, 'HTML quote escaping retains the complete &quot; entity');

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
  'analysisBtn',
  'usageBtn',
  'trashBtn',
  'modal',
  'modalBody',
  'processing'
]) {
  required(html, new RegExp(`id=["']${id}["']`), `required DOM id ${id} is present`);
}

for (const name of [
  'renderForecasts',
  'renderWorkWindows',
  'applyBootstrap',
  'renderActiveTab',
  'renderTodayTab',
  'renderQuickInputs',
  'renderLogs',
  'renderPlans',
  'rotationCard'
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
required(
  html,
  /function renderTodayTab\(\)\{renderToday\(\);renderOutlook\(\)\}/,
  'Today tab renders base content before outlook insertion'
);
required(
  html,
  /if\(tab==='today'\)\{renderTodayTab\(\)\}/,
  'active Today tab delegates full redraw to renderTodayTab'
);
required(
  html,
  /#outlookDays['"]\)\.onchange=e=>\{state\.outlookDays=Number\(e\.target\.value\);syncAppSettings\(\);renderTodayTab\(\)\}/,
  'outlook range changes preserve the outlook card after redraw'
);
assert.doesNotMatch(html, /renderOutlook\(\);renderToday\(\)/, 'outlook must not render before renderToday clears todayList');
ok('Today outlook render order cannot regress to outlook-before-base rendering');
required(
  html,
  /if\(action==='postpone'\)\{date=prompt\('延期後の日付（YYYY-MM-DD）'\);if\(!date\)return\}/,
  'bulk postpone collects a target date before mutation'
);
required(
  html,
  /buildBulkPlanRequest\(action,\[\.\.\.state\.selectedPlans\],date\)/,
  'bulk plan payload delegates to plan-bulk-utils'
);

for (const modulePath of [
  './client/weather-runtime.js',
  './client/download-utils.js',
  './client/log-runtime.js',
  './client/quick-input-runtime.js',
  './client/rotation-runtime.js',
  './client/plan-bulk-utils.js'
]) {
  required(html, new RegExp(`import\\(['"]${modulePath.replaceAll('.', '\\.') }['"]\\)`), `${modulePath} is loaded by index.html`);
}

required(
  html,
  /Promise\.all\(\[initializeWeatherRuntime\(\),initializeDownloadRuntime\(\),initializeClientRuntimes\(\)\]\)/,
  'all active client runtimes initialize before app bootstrap'
);
required(combinedClientSource, /from ['"]\.\/weather-utils\.js['"]/, 'weather runtime imports weather-utils.js');
required(combinedClientSource, /from ['"]\.\/log-tools-ui\.js['"]/, 'log runtime imports log-tools-ui.js');
required(combinedClientSource, /installLogToolsUi\(getState\)/, 'log runtime installs log tools UI');
required(combinedClientSource, /action:\s*['"]getAnalysis['"]/, 'history analysis button uses getAnalysis');
required(combinedClientSource, /action:\s*['"]restore['"]/, 'trash restore button uses restore');
required(combinedClientSource, /renderTrashHtml\(data\.trash \|\| \[\]\)/, 'trash UI renders full-bootstrap trash data');
required(combinedClientSource, /export\s+function\s+downloadBrowserBlob\s*\(/, 'downloadBrowserBlob remains owned by the client utility module');
required(html, /quickInputRuntime\.buildGroups\(\)/, 'quick-input UI delegates candidate grouping to quick-input runtime');
required(html, /quickInputRuntime\.toggleFavorite\(x\)/, 'quick-input UI delegates favorite mutation to quick-input runtime');
required(html, /rotationRuntime\.viewModel\(\)/, 'rotation card delegates selection and history model to rotation runtime');
required(html, /logRuntime\.buildLogList\(state\.actuals,state\.plans\)/, 'log UI delegates filtering sorting and pagination to log runtime');
required(html, /return logRuntime\.dayDistance\(x\)/, 'log card delegates distance calculation to log runtime');
required(html, /return logRuntime\.planTiming\(x\)/, 'plan filtering delegates timing classification to log runtime');

assert.doesNotMatch(
  html,
  /const fav=state\.quickFavorites\.filter\(x=>x\.action\),seen=new Set\(fav\.map\(quickKey\)\)/,
  'index.html must not recreate quick-input grouping logic inline'
);
ok('index.html does not recreate quick-input grouping logic inline');
assert.doesNotMatch(
  html,
  /const r=dateRange\(\),s=state\.search,active=!!\(s\.q\|\|s\.start/,
  'index.html must not recreate log filtering and pagination inline'
);
ok('index.html does not recreate log filtering and pagination inline');
assert.doesNotMatch(
  html,
  /const items=activeRotationPlans\(\);if\(!items\.length\)return''/,
  'index.html must not recreate rotation current-next-after selection inline'
);
ok('index.html does not recreate rotation selection logic inline');

required(
  html,
  /if\(savedDraft\)\{\$\$\('\[data-input-type\]'\)\.forEach\(/,
  'saved draft restoration still updates all input-type controls'
);
required(
  html,
  /downloadBrowserBlob\(csv,`植物栽培管理日誌_\$\{localDate\(new Date\(\)\)\}\.csv`,'text\/csv;charset=utf-8'\)/,
  'CSV export still delegates browser download to downloadBrowserBlob'
);
assert.doesNotMatch(html, /new\s+Blob\s*\(/, 'index.html must not recreate browser Blob download responsibility');
ok('index.html does not recreate browser Blob download responsibility');

console.log(`checked ${inlineScripts.length} inline script block(s) and ${clientFiles.length} client file(s)`);
