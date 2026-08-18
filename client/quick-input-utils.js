export function quickKey(x = {}) {
  return [
    x.action,
    x.plantName,
    x.place,
    x.category,
    x.material,
    x.pesticide,
    x.liquidFertilizer,
    x.dilution,
    x.sprayTarget,
    x.targetPest
  ].map(v => String(v || '').trim()).join('|');
}

export function quickTemplate(x = {}, makeId = () => crypto.randomUUID()) {
  return {
    qid: x.qid || makeId(),
    plantName: x.plantName || '',
    place: x.place || '',
    category: x.category || 'その他',
    action: x.action || '',
    quantity: x.quantity || '',
    material: x.material || '',
    pesticide: x.pesticide || '',
    liquidFertilizer: x.liquidFertilizer || '',
    dilution: x.dilution || '',
    sprayTarget: x.sprayTarget || '',
    targetPest: x.targetPest || '',
    memo: x.memo || ''
  };
}

export function isFavoriteRecord(x, favorites = []) {
  const key = quickKey(x);
  return favorites.some(v => quickKey(v) === key);
}

export function recentQuickCandidates(actuals = [], favorites = [], limit = 8) {
  const seen = new Set(favorites.map(quickKey));
  return [...actuals]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter(x => {
      const key = quickKey(x);
      if (!x.action || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
