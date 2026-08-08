import assert from 'node:assert/strict';
import * as extracted from '../client/weather-utils.js';

const rules={spray:{rain:0.5,rainProbability:40,wind:5},liquid:{rain:1,rainProbability:60,wind:7}};
const state={weatherRules:rules,forecastHourly:[]};

function inlineForecastWeatherName(value){const code=typeof value==='object'?value?.code:value,weather=typeof value==='object'?value?.weather:'';if(weather)return weather;if(code===0)return'晴れ';if([1,2].includes(code))return'晴れ時々曇り';if(code===3)return'曇り';if([45,48].includes(code))return'霧';if(code>=51&&code<=67)return'雨';if(code>=71&&code<=77)return'雪';if(code>=80&&code<=82)return'にわか雨';if(code>=85&&code<=86)return'にわか雪';if(code>=95)return'雷雨';return'天気不明'}
function inlineWeatherRule(kind='spray'){return state.weatherRules[kind]||state.weatherRules.spray}
function inlineForecastRain(f,kind='spray'){const r=inlineWeatherRule(kind);return!!f&&(Number(f.rain||0)>=Number(r.rain)||Number(f.rainProbability||0)>=Number(r.rainProbability)||/雨|雷|雪/.test(f.weather||'')||((f.code>=51&&f.code<=67)||(f.code>=80&&f.code<=82)||f.code>=95))}
function inlineForecastStrongWind(f,kind='spray'){return!!f&&Number(f.maxWind??f.wind)>=Number(inlineWeatherRule(kind).wind)}
function inlineWeatherWorkRisk(f,kind='spray'){return inlineForecastRain(f,kind)||inlineForecastStrongWind(f,kind)}
function inlineRiskReason(f,kind='spray'){return[inlineForecastRain(f,kind)?'雨':'',inlineForecastStrongWind(f,kind)?`強風${Number(f.maxWind??f.wind).toFixed(1)}m/s`:'' ].filter(Boolean).join('・')}
function inlineIsWeatherSensitivePlan(x){return!!x&&(x.category==='消毒'||x.category==='液肥'||x.pesticide||x.liquidFertilizer)}
function inlinePlanWeatherKind(x){return x&&(x.category==='液肥'||x.liquidFertilizer)&&!(x.category==='消毒'||x.pesticide)?'liquid':'spray'}
function inlineSafeWindows(date,kind){const rows=state.forecastHourly.filter(x=>String(x.datetime||'').slice(0,10)===date).filter(x=>{const h=new Date(x.datetime).getHours();return h>=6&&h<=18&&!inlineWeatherWorkRisk(x,kind)});if(!rows.length)return'候補なし';const hours=rows.map(x=>new Date(x.datetime).getHours()).sort((a,b)=>a-b),groups=[];hours.forEach(h=>{const g=groups.at(-1);if(g&&h<=g[1]+3)g[1]=h;else groups.push([h,h])});return groups.map(g=>`${g[0]}〜${Math.min(g[1]+3,21)}時`).join('、')}

for(const value of [null,undefined,0,1,2,3,45,48,51,67,71,77,80,82,85,86,95,99,{code:0},{code:95},{code:95,weather:'独自'}]){
  assert.equal(extracted.forecastWeatherName(value),inlineForecastWeatherName(value),`weather name parity failed for ${JSON.stringify(value)}`);
}

const forecasts=[
  null,
  {},
  {rain:0,rainProbability:0,code:0,wind:0},
  {rain:0.49,rainProbability:39,code:0,maxWind:4.9},
  {rain:0.5,rainProbability:0,code:0,maxWind:0},
  {rain:0,rainProbability:40,code:0,maxWind:0},
  {rain:0,rainProbability:0,code:51,maxWind:0},
  {rain:0,rainProbability:0,weather:'小雨',maxWind:0},
  {rain:0,rainProbability:0,weather:'雪',maxWind:0},
  {rain:0,rainProbability:0,code:0,maxWind:5},
  {rain:0,rainProbability:0,code:0,wind:5},
  {rain:1,rainProbability:60,code:0,maxWind:7}
];
for(const kind of ['spray','liquid','unknown']){
  assert.deepEqual(extracted.weatherRule(rules,kind),inlineWeatherRule(kind),`weather rule parity failed for ${kind}`);
  for(const f of forecasts){
    assert.equal(extracted.forecastRain(f,rules,kind),inlineForecastRain(f,kind),`rain parity failed for ${kind} ${JSON.stringify(f)}`);
    assert.equal(extracted.forecastStrongWind(f,rules,kind),inlineForecastStrongWind(f,kind),`wind parity failed for ${kind} ${JSON.stringify(f)}`);
    assert.equal(extracted.weatherWorkRisk(f,rules,kind),inlineWeatherWorkRisk(f,kind),`risk parity failed for ${kind} ${JSON.stringify(f)}`);
    assert.equal(extracted.riskReason(f,rules,kind),inlineRiskReason(f,kind),`reason parity failed for ${kind} ${JSON.stringify(f)}`);
  }
}

const plans=[null,{}, {category:'消毒'},{category:'液肥'},{category:'除草'},{pesticide:'薬剤A'},{liquidFertilizer:'液肥A'},{category:'消毒',liquidFertilizer:'液肥A'}];
for(const plan of plans){
  assert.equal(extracted.isWeatherSensitivePlan(plan),inlineIsWeatherSensitivePlan(plan),`sensitive-plan parity failed for ${JSON.stringify(plan)}`);
  assert.equal(extracted.planWeatherKind(plan),inlinePlanWeatherKind(plan),`plan-kind parity failed for ${JSON.stringify(plan)}`);
}

state.forecastHourly=[
  {datetime:'2026-08-08T05:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-08T06:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-08T09:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-08T12:00:00+09:00',rain:1,maxWind:0},
  {datetime:'2026-08-08T15:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-08T18:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-08T19:00:00+09:00',rain:0,maxWind:0},
  {datetime:'2026-08-09T09:00:00+09:00',rain:0,maxWind:8}
];
for(const date of ['2026-08-08','2026-08-09','2026-08-10']){
  for(const kind of ['spray','liquid']){
    assert.equal(extracted.safeWindows(date,kind,state.forecastHourly,rules),inlineSafeWindows(date,kind),`safe-window parity failed for ${date} ${kind}`);
  }
}

console.log('ok - weather semantic parity with current inline implementation');
