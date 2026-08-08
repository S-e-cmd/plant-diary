import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWeatherExtraction, newBuild, oldHelpers, oldStartup } from './weather-extraction-transform.mjs';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const transformed=transformWeatherExtraction(html);

assert.notEqual(transformed,html,'dry-run transform must change the current pre-switch client');
assert.ok(transformed.includes(newBuild),'dry-run result must contain the new client build marker');
assert.ok(!transformed.includes(oldHelpers),'dry-run result must remove inline weather helpers');
assert.ok(!transformed.includes(oldStartup),'dry-run result must remove eager startup');
assert.ok(transformed.includes("import('./client/weather-runtime.js')"),'dry-run result must load weather runtime');

const scripts=[...transformed.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length>0,'transformed client must contain an inline script');
const clientSource=scripts.at(-1)[1];
new Function(clientSource);

const initializeAt=clientSource.indexOf('await initializeWeatherRuntime()');
const bootstrapAt=clientSource.indexOf('await bootstrap()',initializeAt);
assert.ok(initializeAt>=0,'startup must await weather runtime initialization');
assert.ok(bootstrapAt>initializeAt,'bootstrap must run only after weather runtime initialization');

console.log('ok - weather extraction dry-run');
