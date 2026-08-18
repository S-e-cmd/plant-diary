import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dateRange, dayDistance, planTiming } from '../client/log-date-utils.js';
import { filterLogs, filterPeriod, isSearchActive, paginateLogs, sortLogs } from '../client/log-list-utils.js';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const logUtils = await readFile(new URL('../client/log-date-utils.js', import.meta.url), 'utf8');
const logListUtils = await readFile(new URL('../client/log-list-utils.js', import.meta.url), 'utf8');

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
required(logListUtils, /export function isSearchActive\(/, 'log-list-utils exports isSearchActive');
required(logListUtils, /export function filterLogs\(/, 'log-list-utils exports filterLogs');
required(logListUtils, /export function filterPeriod\(/, 'log-list-utils exports filterPeriod');
required(logListUtils, /export function sortLogs\(/, 'log-list-utils exports sortLogs');
required(logListUtils, /export function paginateLogs\(/, 'log-list-utils exports paginateLogs');

const day = dateRange(new Date('2026-08-18T12:00:00'), 'day');
assert.equal(day.start, '2026-08-18');
assert.equal(day.end, '2026-08-18');

const week = dateRange(new Date('2026-08-18T12:00:00'), 'week');
assert.deepEqual([week.start, week.end], ['2026-08-17', '2026-08-23']);

const month = dateRange(new Date('2026-08-18T12:00:00'), 'month');
assert.deepEqual([month.start, month.end], ['2026-08-01', '2026-08-31']);

assert.equal(dayDistance({ date: '2026-08-18' }, '2026-08-18'), '今日');
assert.equal(dayDistance({ endDate: '2026-08-16' }, '2026-08-18'), '2日超過');
assert.equal(dayDistance({ startDate: '2026-08-21' }, '2026-08-18'), 'あと3日');
assert.equal(planTiming({}, '2026-08-18'), 'undated');
assert.equal(planTiming({ date: '2026-08-17' }, '2026-08-18'), 'overdue');
assert.equal(planTiming({ date: '2026-08-18' }, '2026-08-18'), 'today');
assert.equal(planTiming({ startDate: '2026-08-17', endDate: '2026-08-19' }, '2026-08-18'), 'today');
assert.equal(planTiming({ date: '2026-08-19' }, '2026-08-18'), 'future');
console.log('ok - log date utility behavior matches existing contracts');

const fixtures = [
  { id: 'a', type: 'actual', date: '2026-08-18', category: '消毒', action: '薬剤散布', plantName: 'A', pesticide: '薬剤A', status: '' },
  { id: 'b', type: 'plan', date: '2026-08-19', category: '液肥', action: '液肥', plantName: 'B', liquidFertilizer: '液肥B', status: '未完了' },
  { id: 'c', type: 'actual', date: '2026-08-17', category: '除草', action: '除草', plantName: 'C', status: '' }
];
assert.equal(isSearchActive({ q: '', start: '', end: '', type: '', status: '', category: '', special: '' }), false);
assert.equal(isSearchActive({ q: '薬剤' }), true);
assert.deepEqual(filterLogs(fixtures, { q: '薬剤', start: '', end: '', type: '', status: '', category: '', special: '' }).map(x => x.id), ['a']);
assert.deepEqual(filterLogs(fixtures, { q: '', start: '', end: '', type: 'plan', status: '未完了', category: '', special: 'liquid' }).map(x => x.id), ['b']);
assert.deepEqual(filterPeriod(fixtures, { start: '2026-08-18', end: '2026-08-19' }).map(x => x.id), ['a', 'b']);
assert.deepEqual(sortLogs(fixtures, 'desc').map(x => x.id), ['b', 'a', 'c']);
assert.deepEqual(sortLogs(fixtures, 'asc').map(x => x.id), ['c', 'a', 'b']);
const paged = paginateLogs(Array.from({ length: 45 }, (_, i) => ({ id: String(i + 1) })), 3, 20);
assert.equal(paged.pages, 3);
assert.equal(paged.page, 3);
assert.equal(paged.start, 40);
assert.equal(paged.pageItems.length, 5);
assert.equal(paginateLogs(Array.from({ length: 5 }), 9, 20).page, 1);
console.log('ok - log search, sort, period, and pagination utilities match existing contracts');

console.log(`log contract: ok (${switched ? 'switched' : 'staged'})`);
