process.env.TZ = 'Asia/Tokyo';

import assert from 'node:assert/strict';
import { dateRange, dayDistance, planTiming } from '../client/log-date-utils.js';

const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',weekday:'short'}) : '日付未定';

function inlineDateRange(cursor, view) {
  const d = new Date(cursor);
  if (view === 'day') {
    const k = localDate(d);
    return { start:k, end:k, label:d.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}) };
  }
  if (view === 'week') {
    const day = d.getDay() || 7;
    const s = new Date(d);
    s.setDate(d.getDate()-day+1);
    const e = new Date(s);
    e.setDate(s.getDate()+6);
    return { start:localDate(s), end:localDate(e), label:`${fmtDate(localDate(s))}〜${fmtDate(localDate(e))}` };
  }
  const s = new Date(d.getFullYear(),d.getMonth(),1);
  const e = new Date(d.getFullYear(),d.getMonth()+1,0);
  return { start:localDate(s), end:localDate(e), label:d.toLocaleDateString('ja-JP',{year:'numeric',month:'long'}) };
}

function inlineDayDistance(x, today) {
  const d = x.endDate || x.date || x.startDate;
  if (!d) return '';
  const n = Math.round((new Date(`${d}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  return n < 0 ? `${Math.abs(n)}日超過` : n === 0 ? '今日' : `あと${n}日`;
}

function inlinePlanTiming(x, today) {
  if (!x.date && !x.startDate) return 'undated';
  if ((x.endDate || x.date) < today) return 'overdue';
  if (x.date === today || x.startDate === today || (x.startDate && x.endDate && x.startDate <= today && x.endDate >= today)) return 'today';
  return 'future';
}

for (const cursor of [
  new Date('2026-01-01T12:00:00+09:00'),
  new Date('2026-02-28T12:00:00+09:00'),
  new Date('2026-03-01T12:00:00+09:00'),
  new Date('2026-08-09T12:00:00+09:00'),
  new Date('2026-12-31T12:00:00+09:00')
]) {
  for (const view of ['day','week','month']) {
    assert.deepEqual(dateRange(cursor, view), inlineDateRange(cursor, view), `dateRange parity ${cursor.toISOString()} ${view}`);
  }
}

const today = '2026-08-09';
for (const entry of [
  {},
  { date:'2026-08-08' },
  { date:'2026-08-09' },
  { date:'2026-08-10' },
  { startDate:'2026-08-07', endDate:'2026-08-08' },
  { startDate:'2026-08-08', endDate:'2026-08-10' },
  { startDate:'2026-08-10', endDate:'2026-08-12' },
  { date:'2026-08-20', startDate:'2026-08-01', endDate:'2026-08-08' }
]) {
  assert.equal(dayDistance(entry, today), inlineDayDistance(entry, today), `dayDistance parity ${JSON.stringify(entry)}`);
  assert.equal(planTiming(entry, today), inlinePlanTiming(entry, today), `planTiming parity ${JSON.stringify(entry)}`);
}

console.log('log date semantic parity: ok');
