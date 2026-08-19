import { GasResponseError, GasTimeoutError, fetchGas, parseGasJson } from './worker/gas-transport.js';
import { ApiContractError, normalizeApiBody } from './worker/api-contract.js';

const API_PATH = '/api'; // build: 2026-08-19-v39
const API_METHOD = 'POST';
const STARTUP_SCRIPT_PATH = '/client/startup-loader.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== API_PATH) {
      return serveAsset_(request, env, url.pathname);
    }

    return handleApiRequest_(request);
  }
};

async function serveAsset_(request, env, pathname) {
  const response = await env.ASSETS.fetch(request);
  if (!response.ok || (pathname !== '/' && pathname !== '/index.html')) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const marker = '<script>';
  if (!html.includes(marker) || html.includes('data-startup-loader')) {
    return new Response(html, { status: response.status, headers: response.headers });
  }

  const loaderUrl = new URL(STARTUP_SCRIPT_PATH, request.url);
  const loaderResponse = await env.ASSETS.fetch(new Request(loaderUrl, { method: 'GET' }));
  const startupScript = loaderResponse.ok
    ? `<script data-startup-loader>\n${await loaderResponse.text()}\n</script>`
    : `<script src=".${STARTUP_SCRIPT_PATH}" data-startup-loader></script>`;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(html.replace(marker, `${startupScript}\n${marker}`), {
    status: response.status,
    headers
  });
}

function requestAction_(body) {
  try {
    return JSON.parse(body)?.action || '';
  } catch {
    return '';
  }
}

function isBootstrapShape_(result) {
  return !!(result && typeof result === 'object' && (Array.isArray(result.actuals) || Array.isArray(result.plans)));
}

function normalizeWrappedBootstrap_(payload, result, metaKey, meta) {
  if (result?.bootstrap && typeof result.bootstrap === 'object') {
    return {
      ...payload,
      data: {
        ...result.bootstrap,
        [metaKey]: meta
      }
    };
  }
  if (isBootstrapShape_(result)) return payload;
  return null;
}

function normalizeGasResponse_(action, payload) {
  if (!payload?.ok) return payload;

  const result = payload.data;
  if (action === 'syncAllPlansCalendar') {
    const normalized = normalizeWrappedBootstrap_(payload, result, 'calendarBulkResult', {
      registered: Number(result?.registered) || 0,
      skipped: Number(result?.skipped) || 0
    });
    if (normalized) return normalized;
    throw new GasResponseError('GASの一括カレンダー応答形式が不正です。');
  }

  if (action === 'batchPlans') {
    const normalized = normalizeWrappedBootstrap_(payload, result, 'batchPlansResult', {
      processed: Number(result?.processed) || 0,
      skipped: Number(result?.skipped) || 0
    });
    if (normalized) return normalized;
    throw new GasResponseError('GASの一括予定応答形式が不正です。');
  }

  return payload;
}

async function handleApiRequest_(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: apiHeaders_() });
  }

  if (request.method !== API_METHOD) {
    return json_({ ok: false, error: 'POSTのみ利用できます。' }, 405);
  }

  const body = await request.text();
  if (!body) {
    return json_({ ok: false, error: '送信内容が空です。' }, 400);
  }

  try {
    const normalizedBody = normalizeApiBody(body);
    const action = requestAction_(normalizedBody);
    const gasResponse = await fetchGas(normalizedBody);
    const data = normalizeGasResponse_(action, await parseGasJson(gasResponse));
    return json_(data, gasResponse.ok ? 200 : gasResponse.status);
  } catch (error) {
    if (error instanceof ApiContractError) {
      return json_({ ok: false, error: error.message }, 400);
    }

    if (error instanceof GasTimeoutError) {
      return json_({ ok: false, error: error.message }, 504);
    }

    if (error instanceof GasResponseError) {
      return json_({ ok: false, error: error.message }, 502);
    }

    return json_({
      ok: false,
      error: 'GASとの通信に失敗しました: ' + String(error?.message || error)
    }, 502);
  }
}

function json_(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: apiHeaders_()
  });
}

function apiHeaders_() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
}
