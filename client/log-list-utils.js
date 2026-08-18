const SEARCH_TEXT_FIELDS = [
  'plantName',
  'place',
  'category',
  'action',
  'quantity',
  'material',
  'pesticide',
  'liquidFertilizer',
  'dilution',
  'sprayTarget',
  'targetPest',
  'observation',
  'memo'
];

export function isSearchActive(search) {
  const s = search || {};
  return !!(s.q || s.start || s.end || s.type || s.status || s.category || s.special);
}

export function filterLogs(items, search) {
  const s = search || {};
  const q = String(s.q || '').trim().toLowerCase();
  return [...items].filter(item => {
    const date = item.date || item.startDate || '';
    const text = SEARCH_TEXT_FIELDS
      .map(field => item[field])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const special =
      !s.special ||
      (s.special === 'spray' && !!item.pesticide) ||
      (s.special === 'liquid' && !!item.liquidFertilizer);
    return (
      (!s.start || date >= s.start) &&
      (!s.end || date <= s.end) &&
      (!q || text.includes(q)) &&
      (!s.type || item.type === s.type) &&
      (!s.status || item.status === s.status) &&
      (!s.category || item.category === s.category) &&
      special
    );
  });
}

export function filterPeriod(items, range) {
  return [...items].filter(item => item.date && item.date >= range.start && item.date <= range.end);
}

export function sortLogs(items, sort = 'desc') {
  return [...items].sort((a, b) => {
    const comparison = (b.date || b.startDate || '').localeCompare(a.date || a.startDate || '');
    return sort === 'desc' ? comparison : -comparison;
  });
}

export function paginateLogs(items, page, pageSize) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  return {
    pages,
    page: currentPage,
    start,
    pageItems: items.slice(start, start + pageSize)
  };
}
