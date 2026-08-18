import assert from 'node:assert/strict';
import { buildStartupSnapshot, STARTUP_SNAPSHOT_KEY } from '../client/startup-snapshot.js';

const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const originalApplyBootstrap = globalThis.applyBootstrap;
const todayDate = new Date();
const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
const cachedData = { actuals: [{ id: 'cached', type: 'actual', date: today, action: 'cached' }], plans: [] };
const freshData = { actuals: [{ id: 'fresh', type: 'actual', date: today, action: 'fresh' }], plans: [] };
const values = new Map([
  ['plantDiaryLastTab', 'today'],
  [STARTUP_SNAPSHOT_KEY, JSON.stringify(buildStartupSnapshot(cachedData, today))]
]);
let upstreamCalls = 0;
let applied = null;

globalThis.localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); }
};
globalThis.fetch = async () => {
  upstreamCalls += 1;
  return new Response(JSON.stringify({ ok: true, data: freshData }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
globalThis.applyBootstrap = data => { applied = data; };

try {
  const moduleUrl = new URL('../client/startup-runtime.js', import.meta.url);
  moduleUrl.searchParams.set('test', String(Date.now()));
  const { installStartupRuntime } = await import(moduleUrl.href);
  assert.equal(installStartupRuntime(), true);

  const response = await globalThis.fetch('/api', {
    method: 'POST',
    body: JSON.stringify({ action: 'bootstrap' })
  });
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.actuals[0].id, 'cached');
  assert.equal(upstreamCalls, 1);

  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(applied?.actuals?.[0]?.id, 'fresh');
  const refreshed = JSON.parse(values.get(STARTUP_SNAPSHOT_KEY));
  assert.equal(refreshed.data.actuals[0].id, 'fresh');

  console.log('ok - startup runtime serves snapshot and refreshes in background');
} finally {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  if (originalApplyBootstrap === undefined) delete globalThis.applyBootstrap;
  else globalThis.applyBootstrap = originalApplyBootstrap;
}
