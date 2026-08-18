import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;
const originalApplyBootstrap = globalThis.applyBootstrap;

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const calls = [];
globalThis.fetch = async (input, init = {}) => {
  calls.push(JSON.parse(init.body || '{}').action || '');
  const action = JSON.parse(init.body || '{}').action;
  const data = action === 'bootstrapCore'
    ? { actuals: [], plans: [], pinned: {}, masters: {}, appSettings: {}, intervalRules: [], bootstrapComplete: false }
    : { actuals: [{ id: 'a1', date: new Date().toISOString().slice(0, 10) }], plans: [], pinned: {}, masters: {}, appSettings: {}, intervalRules: [] };
  return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

globalThis.applyBootstrap = () => {};

try {
  const moduleUrl = new URL('../client/startup-loader.js', import.meta.url);
  moduleUrl.searchParams.set('test', String(Date.now()));
  await import(moduleUrl.href);

  const response = await globalThis.fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bootstrap' })
  });
  const body = await response.json();

  assert.equal(body.ok, true);
  assert.equal(body.data.bootstrapComplete, false);
  assert.equal(calls[0], 'bootstrapCore');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(calls.includes('bootstrap'));
  assert.ok(globalThis.localStorage.getItem('plantDiaryStartupSnapshot'));

  console.log('ok - startup loader uses core first and refreshes full bootstrap in background');
} finally {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  if (originalApplyBootstrap === undefined) delete globalThis.applyBootstrap;
  else globalThis.applyBootstrap = originalApplyBootstrap;
}
