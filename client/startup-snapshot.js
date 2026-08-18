export const STARTUP_SNAPSHOT_KEY = 'plantDiaryStartupSnapshot';
export const STARTUP_SNAPSHOT_VERSION = 1;

export function buildStartupSnapshot(data, today) {
  const source = data && typeof data === 'object' ? data : {};
  const actuals = (source.actuals || []).filter(item => item && (item.date === today || item.rotationName));
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
