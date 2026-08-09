export function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatShortDate(value) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      })
    : '日付未定';
}

export function dateRange(cursor, view) {
  const date = new Date(cursor);

  if (view === 'day') {
    const key = localDateString(date);
    return {
      start: key,
      end: key,
      label: date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    };
  }

  if (view === 'week') {
    const day = date.getDay() || 7;
    const start = new Date(date);
    start.setDate(date.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startKey = localDateString(start);
    const endKey = localDateString(end);
    return {
      start: startKey,
      end: endKey,
      label: `${formatShortDate(startKey)}〜${formatShortDate(endKey)}`
    };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: localDateString(start),
    end: localDateString(end),
    label: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  };
}

export function dayDistance(entry, today) {
  const date = entry.endDate || entry.date || entry.startDate;
  if (!date) return '';

  const days = Math.round(
    (new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000
  );

  return days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? '今日' : `あと${days}日`;
}

export function planTiming(entry, today) {
  if (!entry.date && !entry.startDate) return 'undated';
  if ((entry.endDate || entry.date) < today) return 'overdue';
  if (
    entry.date === today ||
    entry.startDate === today ||
    (entry.startDate && entry.endDate && entry.startDate <= today && entry.endDate >= today)
  ) {
    return 'today';
  }
  return 'future';
}
