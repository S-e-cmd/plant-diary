process.env.TZ='Asia/Tokyo';

import assert from 'node:assert/strict';
import { createWeatherRuntime } from '../client/weather-runtime.js';

const state={
  weatherRules:{
    spray:{rain:0.5,rainProbability:40,wind:5},
    liquid:{rain:1,rainProbability:60,wind:4}
  },
  forecastHourly:[
    {datetime:'2026-08-08T06:00:00+09:00',rain:0,maxWind:1},
    {datetime:'2026-08-08T09:00:00+09:00',rain:0,maxWind:1},
    {datetime:'2026-08-08T12:00:00+09:00',rain:1,maxWind:1}
  ]
};

const runtime=createWeatherRuntime(()=>state);

assert.equal(runtime.forecastWeatherName(0),'晴れ');
assert.deepEqual(runtime.weatherRule('spray'),state.weatherRules.spray);
assert.equal(runtime.forecastRain({rainProbability:40},'spray'),true);
assert.equal(runtime.forecastRain({rainProbability:40},'liquid'),false);
assert.equal(runtime.forecastStrongWind({maxWind:4},'liquid'),true);
assert.equal(runtime.weatherWorkRisk({rain:0,maxWind:5},'spray'),true);
assert.equal(runtime.riskReason({rain:1,maxWind:6},'spray'),'雨・強風6.0m/s');
assert.equal(runtime.isWeatherSensitivePlan({category:'消毒'}),true);
assert.equal(runtime.planWeatherKind({category:'液肥'}),'liquid');
assert.equal(runtime.safeWindows('2026-08-08','spray'),'6〜12時');

state.weatherRules.spray.wind=1;
assert.equal(runtime.forecastStrongWind({maxWind:1},'spray'),true,'runtime reads current state instead of a stale snapshot');

console.log('ok - weather runtime adapter contract');
