import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const logUtils = await readFile(new URL('../client/log-date-utils.js', import.meta.url), 'utf8');

function required(source, pattern, message) {
  assert.match(source, pattern, message);
  console.log(`ok - ${message}`);
}

required(html, /logPageSize:20/, 'log pagination keeps the existing 20-item page size');
required(
  html,
  /state\.visibleLogs=items;const pages=Math\.max\(1,Math\.ceil\(items\.length\/state\.logPageSize\)\)/,
  'renderLogs keeps visible-log state and page calculation'
);
required(
  html,
  /const c=\(b\.date\|\|b\.startDate\|\|''\)\.localeCompare\(a\.date\|\|a\.startDate\|\|''\);return state\.logSort==='desc'\?c:-c/,
  'renderLogs keeps existing ascending/descending sort behavior'
);
required(
  html,
  /state\.search=\{q:'',start:'',end:'',type:'',status:'',category:'',special:''\}/,
  'log search keeps the existing filter-state shape'
);

const switched = html.includes("import('./client/log-date-utils.js')");
if (switched) {
  required(html, /dateRange=\(\)=>log\.dateRange\(state\.cursor,state\.view\)/, 'dateRange is wired to log-date-utils');
  required(html, /dayDistance=x=>log\.dayDistance\(x,localDate\(new Date\(\)\)\)/, 'dayDistance is wired to log-date-utils');
  required(html, /planTiming=log\.planTiming/, 'planTiming is wired to log-date-utils');
  assert.ok(!html.includes('function dateRange(){'), 'inline dateRange must be removed after extraction');
  assert.ok(!html.includes('function dayDistance(x){'), 'inline dayDistance must be removed after extraction');
  assert.ok(!html.includes('function planTiming(x,today){'), 'inline planTiming must be removed after extraction');
} else {
  required(html, /function dateRange\(\)\{const d=new Date\(state\.cursor\);if\(state\.view==='day'\)/, 'staged dateRange remains present');
  required(html, /function dayDistance\(x\)\{const d=x\.endDate\|\|x\.date\|\|x\.startDate;if\(!d\)return'';/, 'staged dayDistance remains present');
  required(html, /function planTiming\(x,today\)\{if\(!x\.date&&!x\.startDate\)return'undated'/, 'staged planTiming remains present');
}

required(logUtils, /export function dateRange\(/, 'log-date-utils exports dateRange');
required(logUtils, /export function dayDistance\(/, 'log-date-utils exports dayDistance');
required(logUtils, /export function planTiming\(/, 'log-date-utils exports planTiming');

console.log(`log contract: ok (${switched ? 'switched' : 'staged'})`);
