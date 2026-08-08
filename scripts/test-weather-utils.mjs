import assert from 'node:assert/strict';
import {
  forecastWeatherName,
  forecastRain,
  forecastStrongWind,
  weatherWorkRisk,
  riskReason,
  isWeatherSensitivePlan,
  planWeatherKind,
  safeWindows
} from '../client/weather-utils.js';

const rules={spray:{rain:0.5,rainProbability:40,wind:5},liquid:{rain:0.5,rainProbability:40,wind:5}};

assert.equal(forecastWeatherName(0),'晴れ');
assert.equal(forecastWeatherName({code:3}),'曇り');
assert.equal(forecastWeatherName({weather:'独自表記',code:95}),'独自表記');
assert.equal(forecastWeatherName(95),'雷雨');
assert.equal(forecastWeatherName(null),'天気不明');

assert.equal(forecastRain({rain:0.5},rules,'spray'),true);
assert.equal(forecastRain({rainProbability:40},rules,'spray'),true);
assert.equal(forecastRain({weather:'雨'},rules,'spray'),true);
assert.equal(forecastRain({code:80},rules,'spray'),true);
assert.equal(forecastRain({rain:0,rainProbability:0,code:0},rules,'spray'),false);

assert.equal(forecastStrongWind({maxWind:5},rules,'spray'),true);
assert.equal(forecastStrongWind({wind:4.9},rules,'spray'),false);
assert.equal(weatherWorkRisk({maxWind:5,rain:0},rules,'spray'),true);
assert.equal(riskReason({rain:1,maxWind:6},rules,'spray'),'雨・強風6.0m/s');

assert.equal(isWeatherSensitivePlan({category:'消毒'}),true);
assert.equal(isWeatherSensitivePlan({liquidFertilizer:'液肥A'}),true);
assert.equal(isWeatherSensitivePlan({category:'除草'}),false);
assert.equal(planWeatherKind({category:'液肥'}),'liquid');
assert.equal(planWeatherKind({category:'消毒',liquidFertilizer:'液肥A'}),'spray');

const hourly=[
  {datetime:'2026-08-08T06:00:00+09:00',rain:0,maxWind:1},
  {datetime:'2026-08-08T09:00:00+09:00',rain:0,maxWind:1},
  {datetime:'2026-08-08T12:00:00+09:00',rain:1,maxWind:1},
  {datetime:'2026-08-08T15:00:00+09:00',rain:0,maxWind:1},
  {datetime:'2026-08-08T18:00:00+09:00',rain:0,maxWind:1}
];
assert.equal(safeWindows('2026-08-08','spray',hourly,rules),'6〜12時、15〜21時');
assert.equal(safeWindows('2026-08-09','spray',hourly,rules),'候補なし');

console.log('ok - weather utility contract');
