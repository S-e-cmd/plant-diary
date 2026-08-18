export const STARTUP_SNAPSHOT_KEY = 'plantDiaryStartupSnapshot';
export const STARTUP_SNAPSHOT_VERSION = 1;

function recentActuals(items, today) {
  const sorted = [...(items || [])].filter(Boolean).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recent = sorted.slice(0, 30);
  const required = sorted.filter(item => item.date === today || item.rotationName);
  const byId = new Map();
  [...recent, ...required].forEach(item => byId.set(item.id || `${item.date}:${item.action}:${item.rotationName || ''}`, item));
  return [...byId.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function buildStartupSnapshot(data, today) {
  const source = data && typeof data === 'object' ? data : {};
  const actuals = recentActuals(source.actuals, today);
  const plans = (source.plans || []).filter(item => item && item.status !== '完了' && item.status !== '中止');
  return {
    version: STARTUP_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    today,
    data: {
      actuals,
      plans,
      trash: [],
      pinned: source.pinned || {},
      summaries: { daily: [], weekly: [], monthly: [] },
      weather: source.weather || null,
      forecasts: source.forecasts || [],
      forecastHourly: source.forecastHourly || [],
      masters: source.masters || {},
      appSettings: source.appSettings || {},
      intervalRules: source.intervalRules || [],
      analysis: null,
      spreadsheetUrl: source.spreadsheetUrl || '',
      today: source.today || today
    }
  };
}

export function isUsableStartupSnapshot(snapshot, today) {
  return !!(
    snapshot &&
    snapshot.version === STARTUP_SNAPSHOT_VERSION &&
    snapshot.today === today &&
    snapshot.data &&
    typeof snapshot.data === 'object'
  );
}

export function readStartupSnapshot(storage, today) {
  if (!storage) return null;
  try {
    const snapshot = JSON.parse(storage.getItem(STARTUP_SNAPSHOT_KEY) || 'null');
    return isUsableStartupSnapshot(snapshot, today) ? snapshot.data : null;
  } catch {
    return null;
  }
}

export function writeStartupSnapshot(storage, data, today) {
  if (!storage) return false;
  try {
    storage.setItem(STARTUP_SNAPSHOT_KEY, JSON.stringify(buildStartupSnapshot(data, today)));
    return true;
  } catch {
    return false;
  }
}
