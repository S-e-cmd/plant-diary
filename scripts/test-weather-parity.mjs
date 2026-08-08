import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const moduleSource = await readFile(new URL('../client/weather-utils.js', import.meta.url), 'utf8');

const expectedSnippets = [
  "function forecastWeatherName(value){const code=typeof value==='object'?value?.code:value,weather=typeof value==='object'?value?.weather:'';if(weather)return weather;if(code===0)return'晴れ';if([1,2].includes(code))return'晴れ時々曇り';if(code===3)return'曇り';if([45,48].includes(code))return'霧';if(code>=51&&code<=67)return'雨';if(code>=71&&code<=77)return'雪';if(code>=80&&code<=82)return'にわか雨';if(code>=85&&code<=86)return'にわか雪';if(code>=95)return'雷雨';return'天気不明'}",
  "function isWeatherSensitivePlan(x){return!!x&&(x.category==='消毒'||x.category==='液肥'||x.pesticide||x.liquidFertilizer)}",
  "function planWeatherKind(x){return x&&(x.category==='液肥'||x.liquidFertilizer)&&!(x.category==='消毒'||x.pesticide)?'liquid':'spray'}"
];

for (const snippet of expectedSnippets) {
  assert.ok(html.includes(snippet), `current inline source changed before staged extraction was switched: ${snippet.slice(0,40)}...`);
}

for (const exportedName of [
  'forecastWeatherName',
  'weatherRule',
  'forecastRain',
  'forecastStrongWind',
  'weatherWorkRisk',
  'riskReason',
  'isWeatherSensitivePlan',
  'planWeatherKind',
  'safeWindows'
]) {
  assert.match(moduleSource, new RegExp(`export function ${exportedName}\\(`), `missing staged export ${exportedName}`);
}

assert.ok(!html.includes('client/weather-utils.js'), 'weather-utils.js must remain inactive until the runtime switch batch');

console.log('ok - staged weather extraction parity guard');
