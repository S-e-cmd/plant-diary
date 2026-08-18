export function isRotationPlan(item) {
  return !!(item && item.type === 'plan' && item.rotationName && Number(item.rotationOrder) > 0);
}

export function activeRotationPlans(plans) {
  return (plans || []).filter(item => isRotationPlan(item) && item.status !== '完了' && item.status !== '中止');
}

export function rotationActuals(actuals, name) {
  return (actuals || [])
    .filter(item => item.rotationName === name)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

export function rotationViewModel(plans, actuals, minimumTotal = 12) {
  const items = activeRotationPlans(plans);
  if (!items.length) return null;

  const current = items[0];
  const next = items[1] || current;
  const after = items[2] || next;
  const total = Math.max(...items.map(item => Number(item.rotationOrder) || 0), minimumTotal);

  return {
    items,
    current,
    next,
    after,
    total,
    count: Number(current.rotationOrder) || 1,
    done: rotationActuals(actuals, current.rotationName).length,
    rows: items.slice(0, total)
  };
}

export function needsNextCycle(plans, rotationName) {
  if (!rotationName) return false;
  const rotationPlans = (plans || []).filter(item => isRotationPlan(item) && item.rotationName === rotationName && item.cyclic !== false);
  if (!rotationPlans.length) return false;
  return !rotationPlans.some(item => item.status !== '完了' && item.status !== '中止');
}
