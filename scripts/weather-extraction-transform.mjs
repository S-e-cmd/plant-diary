import assert from 'node:assert/strict';

export const oldBuild='<!-- build: 2026-07-19-v29 / performance optimization -->';
export const newBuild='<!-- build: 20260808-01 / weather helper extraction -->';

export const oldHelpers=`function forecastWeatherName(value){const code=typeof value==='object'?value?.code:value,weather=typeof value==='object'?value?.weather:'';if(weather)return weather;if(code===0)return'晴れ';if([1,2].includes(code))return'晴れ時々曇り';if(code===3)return'曇り';if([45,48].includes(code))return'霧';if(code>=51&&code<=67)return'雨';if(code>=71&&code<=77)return'雪';if(code>=80&&code<=82)return'にわか雨';if(code>=85&&code<=86)return'にわか雪';if(code>=95)return'雷雨';return'天気不明'}
function weatherRule(kind='spray'){return state.weatherRules[kind]||state.weatherRules.spray}
function forecastRain(f,kind='spray'){const r=weatherRule(kind);return!!f&&(Number(f.rain||0)>=Number(r.rain)||Number(f.rainProbability||0)>=Number(r.rainProbability)||/雨|雷|雪/.test(f.weather||'')||((f.code>=51&&f.code<=67)||(f.code>=80&&f.code<=82)||f.code>=95))}
function forecastStrongWind(f,kind='spray'){return!!f&&Number(f.maxWind??f.wind)>=Number(weatherRule(kind).wind)}
function weatherWorkRisk(f,kind='spray'){return forecastRain(f,kind)||forecastStrongWind(f,kind)}
function riskReason(f,kind='spray'){return[forecastRain(f,kind)?'雨':'',forecastStrongWind(f,kind)?\`強風\${Number(f.maxWind??f.wind).toFixed(1)}m/s\`:'' ].filter(Boolean).join('・')}
function isWeatherSensitivePlan(x){return!!x&&(x.category==='消毒'||x.category==='液肥'||x.pesticide||x.liquidFertilizer)}
function planWeatherKind(x){return x&&(x.category==='液肥'||x.liquidFertilizer)&&!(x.category==='消毒'||x.pesticide)?'liquid':'spray'}
function safeWindows(date,kind){const rows=state.forecastHourly.filter(x=>String(x.datetime||'').slice(0,10)===date).filter(x=>{const h=new Date(x.datetime).getHours();return h>=6&&h<=18&&!weatherWorkRisk(x,kind)});if(!rows.length)return'候補なし';const hours=rows.map(x=>new Date(x.datetime).getHours()).sort((a,b)=>a-b),groups=[];hours.forEach(h=>{const g=groups.at(-1);if(g&&h<=g[1]+3)g[1]=h;else groups.push([h,h])});return groups.map(g=>\`\${g[0]}〜\${Math.min(g[1]+3,21)}時\`).join('、')}`;

export const runtimeBridge=`let forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows;
async function initializeWeatherRuntime(){const {createWeatherRuntime}=await import('./client/weather-runtime.js');({forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows}=createWeatherRuntime(()=>state))}`;

export const oldStartup=`const lastTab=localStorage.getItem('plantDiaryLastTab');if(['today','input','logs','plans'].includes(lastTab))$(\`[data-tab="\${lastTab}"]\`).click();
if(savedDraft){$$('[data-input-type]').forEach(b=>b.classList.toggle('active',b.dataset.inputType===state.inputType));$('#draftNote').textContent='前回の下書きを復元しました'}
bootstrap();`;

export const newStartup=`async function startApp(){busy(true,'初期化中…');try{await initializeWeatherRuntime();const lastTab=localStorage.getItem('plantDiaryLastTab');if(['today','input','logs','plans'].includes(lastTab))$(\`[data-tab="\${lastTab}"]\`).click();if(savedDraft){$$('[data-input-type]').forEach(b=>b.classList.toggle('active',b.dataset.inputType===state.inputType));$('#draftNote').textContent='前回の下書きを復元しました'}await bootstrap()}catch(e){busy(false);toast(e?.message||'初期化に失敗しました')}}
startApp();`;

function count(source,needle){return source.split(needle).length-1}

export function transformWeatherExtraction(html){
  assert.equal(count(html,oldBuild),1,'client build marker must occur exactly once');
  assert.equal(count(html,oldHelpers),1,'inline weather helper block must occur exactly once');
  assert.equal(count(html,oldStartup),1,'startup block must occur exactly once');
  assert.ok(!html.includes("import('./client/weather-runtime.js')"),'weather runtime is already wired; aborting');

  const transformed=html.replace(oldBuild,newBuild).replace(oldHelpers,runtimeBridge).replace(oldStartup,newStartup);

  assert.ok(transformed.includes(newBuild),'new build marker was not applied');
  assert.ok(transformed.includes("import('./client/weather-runtime.js')"),'weather runtime import was not applied');
  assert.ok(transformed.includes('await initializeWeatherRuntime()'),'weather runtime must initialize before startup rendering');
  assert.ok(!transformed.includes(oldHelpers),'old inline weather helper block still remains');
  assert.ok(!transformed.includes(oldStartup),'old eager startup block still remains');
  assert.ok(transformed.includes('function renderForecasts()'),'weather rendering logic must remain inline');
  assert.ok(transformed.includes('function renderWorkWindows()'),'work-window rendering logic must remain inline');
  assert.ok(transformed.includes('function applyBootstrap(d)'),'bootstrap contract must remain inline');

  return transformed;
}
