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
    const today = new Date().toISOString().slice(0, 10);
    const data = action === 'bootstrapCore'
      ? { actuals: [], plans: [], pinned: {}, masters: {}, appSettings: {}, intervalRules: [], bootstrapComplete: false }
      : {
          actuals: [{ id: 'a1', date: today }],
          plans: [],
          pinned: {},
          masters: {},
          appSettings: {},
          intervalRules: [],
          weather: { maxTemp: 34 },
          forecasts: [{ date: today, code: 1 }],
          forecastHourly: [{ datetime: `${today}T09:00:00+09:00` }]
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

const nextTask = () => new Promise(resolve => setTimeout(resolve, 0));

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
    assert.equal(firstBody.data.forecasts.length, 1);
    assert.equal(firstBody.data.forecasts[0].source, 'startup-core');
    assert.deepEqual(calls, ['bootstrapCore'], 'full bootstrap must not start before the initial response is returned');

    await nextTask();
    await nextTask();
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
    const today = new Date().toISOString().slice(0, 10);
    const legacySnapshot = {
      version: 1,
      today,
      data: { actuals: [], plans: [], forecasts: [], forecastHourly: [] }
    };
    globalThis.localStorage = createStorage([
      ['plantDiaryLastTab', 'today'],
      ['plantDiaryStartupSnapshot', JSON.stringify(legacySnapshot)]
    ]);
    globalThis.fetch = createUpstream(calls);
    globalThis.applyBootstrap = () => {};
    globalThis.applyBackgroundForecasts = () => {};
    await loadLoader('legacy-snapshot');

    const response = await globalThis.fetch('/api', {
      method: 'POST',
      body: JSON.stringify({ action: 'bootstrap' })
    });
    const body = await response.json();
    assert.equal(body.data.forecasts.length, 1);
    assert.equal(body.data.forecasts[0].source, 'startup-core');
    assert.deepEqual(calls, [], 'cached startup response must be returned before background refresh starts');
    await nextTask();
    await nextTask();
    assert.deepEqual(calls, ['bootstrap']);
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

  console.log('ok - startup loader returns initial data before deferred full refresh and avoids forecast blocking');
} finally {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  if (originalApplyBootstrap === undefined) delete globalThis.applyBootstrap;
  else globalThis.applyBootstrap = originalApplyBootstrap;
  if (originalApplyBackgroundForecasts === undefined) delete globalThis.applyBackgroundForecasts;
  else globalThis.applyBackgroundForecasts = originalApplyBackgroundForecasts;
}
