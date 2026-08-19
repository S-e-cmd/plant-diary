export function isRotationPlan(item) {
  return !!(item && item.type === 'plan' && item.rotationName && Number(item.rotationOrder) > 0);
}

export function activeRotationPlans(plans, rotationName = '') {
  return (plans || []).filter(item =>
    isRotationPlan(item) &&
    (!rotationName || item.rotationName === rotationName) &&
    item.status !== '完了' &&
    item.status !== '中止'
  );
}

export function rotationActuals(actuals, name) {
  return (actuals || [])
    .filter(item => item.rotationName === name)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

export function rotationNames(plans) {
  return [...new Set((plans || []).filter(isRotationPlan).map(item => item.rotationName).filter(Boolean))];
}

export function normalizeMonthDay(value, fallback = '07-01') {
  const text = String(value || '').trim();
  if (!/^\d{2}-\d{2}$/.test(text)) return fallback;
  const [month, day] = text.split('-').map(Number);
  const probe = new Date(Date.UTC(2000, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return fallback;
  return text;
}

export function rotationSeasonFromPlans(plans, rotationName) {
  const rows = (plans || [])
    .filter(item => isRotationPlan(item) && item.rotationName === rotationName && item.rotationSeasonState)
    .map(item => ({
      state: String(item.rotationSeasonState || ''),
      year: Number(item.rotationSeasonYear) || 0,
      startMonthDay: normalizeMonthDay(item.rotationStartMonthDay),
      updatedAt: String(item.updatedAt || item.createdAt || '')
    }))
    .sort((a, b) => (b.year - a.year) || b.updatedAt.localeCompare(a.updatedAt));
  return rows[0] || null;
}

export function shouldOfferSeasonStart(season, today) {
  if (!season || season.state !== 'ended') return false;
  const todayText = String(today || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayText)) return false;
  const year = Number(todayText.slice(0, 4));
  const endedYear = Number(season.year ?? season.endedYear) || 0;
  if (!endedYear || year <= endedYear) return false;
  return todayText.slice(5) >= normalizeMonthDay(season.startMonthDay);
}

export function rotationViewModel(plans, actuals, minimumTotal = 12, options = {}) {
  const today = options.today || '';
  const names = rotationNames(plans);
  const activeItems = activeRotationPlans(plans);
  const activeName = activeItems[0]?.rotationName || '';
  const candidateName = activeName || names.find(name => {
    const configured = options.seasons?.[name];
    const derived = rotationSeasonFromPlans(plans, name);
    return shouldOfferSeasonStart(configured || derived, today);
  }) || '';
  if (!candidateName) return null;

  const season = options.seasons?.[candidateName] || rotationSeasonFromPlans(plans, candidateName) || {};
  if (!activeName && shouldOfferSeasonStart(season, today)) {
    return {
      mode: 'start',
      rotationName: candidateName,
      startMonthDay: normalizeMonthDay(season.startMonthDay),
      endedYear: Number(season.year ?? season.endedYear) || 0
    };
  }

  if (season.state === 'ended' && !activeName) return null;

  const items = activeRotationPlans(plans, candidateName);
  if (!items.length) return null;

  const current = items[0];
  const next = items[1] || current;
  const after = items[2] || next;
  const total = Math.max(...(plans || [])
    .filter(item => isRotationPlan(item) && item.rotationName === candidateName)
    .map(item => Number(item.rotationOrder) || 0), minimumTotal);

  return {
    mode: 'active',
    items,
    current,
    next,
    after,
    total,
    count: Number(current.rotationOrder) || 1,
    done: rotationActuals(actuals, candidateName).length,
    rows: items.slice(0, total),
    rotationName: candidateName,
    startMonthDay: normalizeMonthDay(season.startMonthDay)
  };
}

export function needsNextCycle(plans, rotationName) {
  if (!rotationName) return false;
  const rotationPlans = (plans || []).filter(item => isRotationPlan(item) && item.rotationName === rotationName && item.cyclic !== false);
  if (!rotationPlans.length) return false;
  return !rotationPlans.some(item => item.status !== '完了' && item.status !== '中止');
}
