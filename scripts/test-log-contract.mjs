import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function required(pattern, message) {
  assert.match(html, pattern, message);
  console.log(`ok - ${message}`);
}

required(
  /logPageSize:20/,
  'log pagination keeps the existing 20-item page size'
);
required(
  /function dateRange\(\)\{const d=new Date\(state\.cursor\);if\(state\.view==='day'\)/,
  'dateRange keeps day-view handling'
);
required(
  /if\(state\.view==='week'\)\{const day=d\.getDay\(\)\|\|7,s=new Date\(d\);s\.setDate\(d\.getDate\(\)-day\+1\);const e=new Date\(s\);e\.setDate\(s\.getDate\(\)\+6\)/,
  'dateRange keeps Monday-to-Sunday week handling'
);
required(
  /const s=new Date\(d\.getFullYear\(\),d\.getMonth\(\),1\),e=new Date\(d\.getFullYear\(\),d\.getMonth\(\)\+1,0\)/,
  'dateRange keeps calendar-month boundaries'
);
required(
  /function dayDistance\(x\)\{const d=x\.endDate\|\|x\.date\|\|x\.startDate;if\(!d\)return'';/,
  'dayDistance keeps end-date/date/start-date precedence'
);
required(
  /return n<0\?`\$\{Math\.abs\(n\)\}日超過`:n===0\?'今日':`あと\$\{n\}日`/,
  'dayDistance keeps overdue/today/future labels'
);
required(
  /function planTiming\(x,today\)\{if\(!x\.date&&!x\.startDate\)return'undated';if\(\(x\.endDate\|\|x\.date\)<today\)return'overdue';/,
  'planTiming keeps undated and overdue classification'
);
required(
  /if\(x\.date===today\|\|x\.startDate===today\|\|\(x\.startDate&&x\.endDate&&x\.startDate<=today&&x\.endDate>=today\)\)return'today';return'future'/,
  'planTiming keeps current-range and future classification'
);
required(
  /state\.visibleLogs=items;const pages=Math\.max\(1,Math\.ceil\(items\.length\/state\.logPageSize\)\)/,
  'renderLogs keeps visible-log state and page calculation'
);
required(
  /const c=\(b\.date\|\|b\.startDate\|\|''\)\.localeCompare\(a\.date\|\|a\.startDate\|\|''\);return state\.logSort==='desc'\?c:-c/,
  'renderLogs keeps existing ascending/descending sort behavior'
);
required(
  /state\.search=\{q:'',start:'',end:'',type:'',status:'',category:'',special:''\}/,
  'log search keeps the existing filter-state shape'
);

console.log('log contract: ok');
