export const oldBuild = '<!-- build: 20260809-02 / browser download utility extraction -->';
export const newBuild = '<!-- build: 20260809-03 / log date utility extraction -->';

export const oldRuntimeDecl = `let forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows,downloadBrowserBlob;\nasync function initializeWeatherRuntime(){const {createWeatherRuntime}=await import('./client/weather-runtime.js');({forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows}=createWeatherRuntime(()=>state))}\nasync function initializeDownloadRuntime(){({downloadBrowserBlob}=await import('./client/download-utils.js'))}`;

export const newRuntimeDecl = `let forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows,downloadBrowserBlob,dateRange,dayDistance,planTiming;\nasync function initializeWeatherRuntime(){const {createWeatherRuntime}=await import('./client/weather-runtime.js');({forecastWeatherName,weatherRule,forecastRain,forecastStrongWind,weatherWorkRisk,riskReason,isWeatherSensitivePlan,planWeatherKind,safeWindows}=createWeatherRuntime(()=>state))}\nasync function initializeDownloadRuntime(){({downloadBrowserBlob}=await import('./client/download-utils.js'))}\nasync function initializeLogDateRuntime(){const log=await import('./client/log-date-utils.js');dateRange=()=>log.dateRange(state.cursor,state.view);dayDistance=x=>log.dayDistance(x,localDate(new Date()));planTiming=log.planTiming}`;

export const oldDateRange = `function dateRange(){const d=new Date(state.cursor);if(state.view==='day'){const k=localDate(d);return{start:k,end:k,label:d.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}}if(state.view==='week'){const day=d.getDay()||7,s=new Date(d);s.setDate(d.getDate()-day+1);const e=new Date(s);e.setDate(s.getDate()+6);return{start:localDate(s),end:localDate(e),label:\`${'${fmtDate(localDate(s))}'}〜${'${fmtDate(localDate(e))}'}\`}}const s=new Date(d.getFullYear(),d.getMonth(),1),e=new Date(d.getFullYear(),d.getMonth()+1,0);return{start:localDate(s),end:localDate(e),label:d.toLocaleDateString('ja-JP',{year:'numeric',month:'long'})}}`;

export const oldDayDistance = `function dayDistance(x){const d=x.endDate||x.date||x.startDate;if(!d)return'';const n=Math.round((new Date(\`${'${d}'}T12:00:00\`)-new Date(\`${'${localDate(new Date())}'}T12:00:00\`))/86400000);return n<0?\`${'${Math.abs(n)}'}日超過\`:n===0?'今日':\`あと${'${n}'}日\`}`;

export const oldPlanTiming = `function planTiming(x,today){if(!x.date&&!x.startDate)return'undated';if((x.endDate||x.date)<today)return'overdue';if(x.date===today||x.startDate===today||(x.startDate&&x.endDate&&x.startDate<=today&&x.endDate>=today))return'today';return'future'}`;

export const oldStartup = `await Promise.all([initializeWeatherRuntime(),initializeDownloadRuntime()])`;
export const newStartup = `await Promise.all([initializeWeatherRuntime(),initializeDownloadRuntime(),initializeLogDateRuntime()])`;

function replaceExactlyOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`log date extraction stopped: ${label} source was not found`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`log date extraction stopped: ${label} source was not unique`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function transformLogDateExtraction(source) {
  let next = source;
  next = replaceExactlyOnce(next, oldBuild, newBuild, 'build marker');
  next = replaceExactlyOnce(next, oldRuntimeDecl, newRuntimeDecl, 'runtime declaration');
  next = replaceExactlyOnce(next, oldDateRange, '', 'dateRange');
  next = replaceExactlyOnce(next, oldDayDistance, '', 'dayDistance');
  next = replaceExactlyOnce(next, oldPlanTiming, '', 'planTiming');
  next = replaceExactlyOnce(next, oldStartup, newStartup, 'startup initialization');
  return next;
}
