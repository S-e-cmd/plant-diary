import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;
const originalApplyBootstrap = globalThis.applyBootstrap;
const originalApplyBackgroundForecasts = globalThis.applyBackgroundForecasts;

function createStorage(values = []) {
  const storage = new Map(values);
  return {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
}

function createUpstream(calls) {
  return async (input, init = {}) => {
    const action = JSON.parse(init.body || '{}').action || '';
    calls.push(action);
    const data = action === 'bootstrapCore'
      ? { actuals: [], plans: [], pinned: {}, masters: {}, appSettings: {}, intervalRules: [], bootstrapComplete: false }
      : {
          actuals: [{ id: 'a1', date: new Date().toISOString().slice(0, 10) }],
          plans: [],
          pinned: {},
          masters: {},
          appSettings: {},
          intervalRules: [],
          weather: { maxTemp: 34 },
          forecasts: [{ date: new Date().toISOString().slice(0, 10), code: 1 }],
          forecastHourly: [{ datetime: `${new Date().toISOString().slice(0, 10)}T09:00:00+09:00` }]
        };
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

async function loadLoader(label) {
  const moduleUrl = new URL('../client/startup-loader.js', import.meta.url);
  moduleUrl.searchParams.set('test', `${label}-${Date.now()}-${Math.random()}`);
  await import(moduleUrl.href);
}

try {
  {
    const calls = [];
    let forecastHandoff = null;
    globalThis.localStorage = createStorage([['plantDiaryLastTab', 'today']]);
    globalThis.fetch = createUpstream(calls);
    globalThis.applyBootstrap = () => {};
    globalThis.applyBackgroundForecasts = data => { forecastHandoff = data; };
    await loadLoader('today');

    const first = await globalThis.fetch('/api', {
      method: 'POST',
      body: JSON.stringify({ action: 'bootstrap' })
    });
    const firstBody = await first.json();
    assert.equal(firstBody.data.bootstrapComplete, false);
    assert.equal(calls[0], 'bootstrapCore');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(calls.slice(0, 2), ['bootstrapCore', 'bootstrap']);
    assert.ok(globalThis.localStorage.getItem('plantDiaryStartupSnapshot'));
    assert.equal(forecastHandoff?.weather?.maxTemp, 34);
    assert.equal(forecastHandoff?.forecasts?.[0]?.code, 1);
    assert.equal(forecastHandoff?.forecastHourly?.length, 1);

    await globalThis.fetch('/api', {
      method: 'POST',
      body: JSON.stringify({ action: 'bootstrap' })
    });
    assert.deepEqual(calls, ['bootstrapCore', 'bootstrap', 'bootstrap']);
  }

  {
    const calls = [];
    globalThis.localStorage = createStorage([['plantDiaryLastTab', 'logs']]);
    globalThis.fetch = createUpstream(calls);
    globalThis.applyBootstrap = () => {};
    globalThis.applyBackgroundForecasts = () => {};
    await loadLoader('logs');

    const response = await globalThis.fetch('/api', {
      method: 'POST',
      body: JSON.stringify({ action: 'bootstrap' })
    });
    const body = await response.json();
    assert.equal(body.data.bootstrapComplete, undefined);
    assert.deepEqual(calls, ['bootstrap']);
    assert.ok(globalThis.localStorage.getItem('plantDiaryStartupSnapshot'));
  }

  console.log('ok - startup loader accelerates only supported initial bootstrap and refreshes forecast state with full data');
} finally {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  if (originalApplyBootstrap === undefined) delete globalThis.applyBootstrap;
  else globalThis.applyBootstrap = originalApplyBootstrap;
  if (originalApplyBackgroundForecasts === undefined) delete globalThis.applyBackgroundForecasts;
  else globalThis.applyBackgroundForecasts = originalApplyBackgroundForecasts;
}
