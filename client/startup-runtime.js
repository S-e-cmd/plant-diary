import { readStartupSnapshot, writeStartupSnapshot } from './startup-snapshot.js';

const SUPPORTED_TABS = new Set(['today', 'input', 'plans']);
let installed = false;

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseBootstrapRequest(input, init) {
  const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method !== 'POST') return null;
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input || '');
  if (!url.endsWith('/api') && url !== '/api') return null;
  if (typeof init?.body !== 'string') return null;
  try {
    const payload = JSON.parse(init.body);
    return payload?.action === 'bootstrap' ? payload : null;
  } catch {
    return null;
  }
}

function withAction(init, action) {
  return { ...init, body: JSON.stringify({ action }) };
}

async function refreshSnapshot(originalFetch, input, init, today) {
  const response = await originalFetch(input, init);
  try {
    const body = await response.clone().json();
    if (response.ok && body?.ok && body.data) {
      writeStartupSnapshot(globalThis.localStorage, body.data, today);
      if (typeof globalThis.applyBootstrap === 'function') {
        globalThis.applyBootstrap(body.data);
      }
    }
  } catch {
    // Keep the original network response contract untouched.
  }
  return response;
}

async function fetchCoreBootstrap(originalFetch, input, init) {
  return originalFetch(input, withAction(init, 'bootstrapCore'));
}

export function installStartupRuntime() {
  if (installed || typeof globalThis.fetch !== 'function' || !globalThis.localStorage) return false;
  installed = true;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async function startupAwareFetch(input, init) {
    if (!parseBootstrapRequest(input, init)) return originalFetch(input, init);

    const today = localDate(new Date());
    const lastTab = globalThis.localStorage.getItem('plantDiaryLastTab') || 'today';
    const snapshot = SUPPORTED_TABS.has(lastTab)
      ? readStartupSnapshot(globalThis.localStorage, today)
      : null;

    if (snapshot) {
      void refreshSnapshot(originalFetch, input, init, today).catch(() => {});
      return new Response(JSON.stringify({ ok: true, data: snapshot }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    const coreResponse = await fetchCoreBootstrap(originalFetch, input, init);
    try {
      const body = await coreResponse.clone().json();
      if (coreResponse.ok && body?.ok && body.data) {
        writeStartupSnapshot(globalThis.localStorage, body.data, today);
      }
    } catch {
      // Return the core response unchanged even when it cannot be cached.
    }

    void refreshSnapshot(originalFetch, input, init, today).catch(() => {});
    return coreResponse;
  };

  return true;
}
