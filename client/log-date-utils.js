function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtDate(value) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })
    : '日付未定';
}

export function dateRange(cursor, view) {
  const d = new Date(cursor);
  if (view === 'day') {
    const key = localDate(d);
    return {
      start: key,
      end: key,
      label: d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    };
  }
  if (view === 'week') {
    const day = d.getDay() || 7;
    const start = new Date(d);
    start.setDate(d.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: localDate(start),
      end: localDate(end),
      label: `${fmtDate(localDate(start))}〜${fmtDate(localDate(end))}`
    };
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: localDate(start),
    end: localDate(end),
    label: d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  };
}

export function dayDistance(item, today) {
  const date = item.endDate || item.date || item.startDate;
  if (!date) return '';
  const days = Math.round((new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  return days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? '今日' : `あと${days}日`;
}

export function planTiming(item, today) {
  if (!item.date && !item.startDate) return 'undated';
  if ((item.endDate || item.date) < today) return 'overdue';
  if (
    item.date === today ||
    item.startDate === today ||
    (item.startDate && item.endDate && item.startDate <= today && item.endDate >= today)
  ) return 'today';
  return 'future';
}
