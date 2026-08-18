(() => {
  const KEY = 'plantDiaryStartupSnapshot';
  const VERSION = 1;
  const SUPPORTED_TABS = new Set(['today', 'input', 'plans']);
  const originalFetch = globalThis.fetch.bind(globalThis);
  let startupHandled = false;

  const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  function isBootstrapRequest(input, init) {
    const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method !== 'POST') return false;
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input || '');
    if (!url.endsWith('/api') && url !== '/api') return false;
    if (typeof init?.body !== 'string') return false;
    try {
      return JSON.parse(init.body)?.action === 'bootstrap';
    } catch {
      return false;
    }
  }

  function readSnapshot(today) {
    try {
      const snapshot = JSON.parse(localStorage.getItem(KEY) || 'null');
      return snapshot?.version === VERSION && snapshot?.today === today && snapshot?.data ? snapshot.data : null;
    } catch {
      return null;
    }
  }

  function buildSnapshot(data, today) {
    const source = data && typeof data === 'object' ? data : {};
    const recentActuals = [...(source.actuals || [])]
      .filter(item => item && item.date)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 30);
    const rotationActuals = (source.actuals || []).filter(item => item?.rotationName);
    const todayActuals = (source.actuals || []).filter(item => item?.date === today);
    const actualMap = new Map();
    [...recentActuals, ...rotationActuals, ...todayActuals].forEach(item => item?.id && actualMap.set(item.id, item));
    const plans = (source.plans || []).filter(item => item && item.status !== '完了' && item.status !== '中止');
    return {
      version: VERSION,
      savedAt: new Date().toISOString(),
      today,
      data: {
        actuals: [...actualMap.values()],
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

  function writeSnapshot(data, today) {
    try {
      localStorage.setItem(KEY, JSON.stringify(buildSnapshot(data, today)));
    } catch {}
  }

  async function fetchJsonData(input, init) {
    const response = await originalFetch(input, init);
    let body = null;
    try { body = await response.clone().json(); } catch {}
    return { response, body };
  }

  function refreshFull(input, init, today) {
    void fetchJsonData(input, init).then(({ response, body }) => {
      if (!response.ok || !body?.ok || !body.data) return;
      writeSnapshot(body.data, today);
      if (typeof globalThis.applyBootstrap === 'function') globalThis.applyBootstrap(body.data);
    }).catch(() => {});
  }

  globalThis.fetch = async function startupFetch(input, init) {
    if (!isBootstrapRequest(input, init)) return originalFetch(input, init);
    if (startupHandled) return originalFetch(input, init);
    startupHandled = true;

    const today = localDate(new Date());
    const lastTab = localStorage.getItem('plantDiaryLastTab') || 'today';

    if (!SUPPORTED_TABS.has(lastTab)) {
      const { response, body } = await fetchJsonData(input, init);
      if (response.ok && body?.ok && body.data) writeSnapshot(body.data, today);
      return response;
    }

    const snapshot = readSnapshot(today);
    if (snapshot) {
      refreshFull(input, init, today);
      return new Response(JSON.stringify({ ok: true, data: snapshot }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    const coreInit = { ...init, body: JSON.stringify({ action: 'bootstrapCore' }) };
    const { response, body } = await fetchJsonData(input, coreInit);
    if (response.ok && body?.ok && body.data) writeSnapshot(body.data, today);
    refreshFull(input, init, today);
    return response;
  };
})();
