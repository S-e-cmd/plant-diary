import { GasResponseError, GasTimeoutError, fetchGas, parseGasJson } from './worker/gas-transport.js';
import { ApiContractError, normalizeApiBody } from './worker/api-contract.js';

const API_PATH = '/api'; // build: 2026-08-19-v45
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

  let html = await response.text();
  const startupScriptResponse = await env.ASSETS.fetch(new Request(new URL(STARTUP_SCRIPT_PATH, request.url), request));
  if (startupScriptResponse.ok) {
    const startupScript = await startupScriptResponse.text();
    html = html.replace('<script>', `<script>${startupScript}\n</script>\n<script>`);
  } else {
    html = html.replace('<script>', `<script src="${STARTUP_SCRIPT_PATH}"></script>\n<script>`);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

async function handleApiRequest_(request) {
  if (request.method !== API_METHOD) {
    return jsonResponse_({ ok: false, error: 'Method Not Allowed' }, 405);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse_({ ok: false, error: 'リクエスト本文を読み取れませんでした。' }, 400);
  }

  try {
    JSON.parse(rawBody);
  } catch {
    return jsonResponse_({ ok: false, error: '正しいJSON形式で送信してください。' }, 400);
  }

  let body;
  try {
    body = normalizeApiBody(rawBody);
  } catch (error) {
    if (error instanceof ApiContractError) {
      return jsonResponse_({ ok: false, error: error.message }, 400);
    }
    throw error;
  }

  try {
    const gasResponse = await fetchGas(body);
    const gasJson = await parseGasJson(gasResponse);
    if (!gasResponse.ok) {
      return jsonResponse_({ ok: false, error: gasJson?.error || 'GASへの接続に失敗しました。' }, 502);
    }
    if (!gasJson?.ok) {
      return jsonResponse_({ ok: false, error: gasJson?.error || 'GASで処理に失敗しました。' }, 400);
    }

    const requestJson = JSON.parse(body);
    if (requestJson.action === 'syncAllPlansCalendar') {
      const wrapper = gasJson.data;
      if (!wrapper?.bootstrap || typeof wrapper.bootstrap !== 'object') {
        return jsonResponse_({ ok: false, error: '一括カレンダー登録の応答形式が正しくありません。' }, 502);
      }
      return jsonResponse_({ ok: true, data: { ...wrapper.bootstrap, calendarBulkResult: { registered: wrapper.registered ?? 0, skipped: wrapper.skipped ?? 0 } } });
    }
    if (requestJson.action === 'batchPlans') {
      const wrapper = gasJson.data;
      if (wrapper?.bootstrap && typeof wrapper.bootstrap === 'object') {
        return jsonResponse_({ ok: true, data: { ...wrapper.bootstrap, batchPlansResult: { processed: wrapper.processed ?? 0, skipped: wrapper.skipped ?? 0 } } });
      }
      if (!wrapper || typeof wrapper !== 'object') {
        return jsonResponse_({ ok: false, error: '一括予定処理の応答形式が正しくありません。' }, 502);
      }
    }
    return jsonResponse_(gasJson);
  } catch (error) {
    if (error instanceof GasTimeoutError) {
      return jsonResponse_({ ok: false, error: error.message }, 504);
    }
    if (error instanceof GasResponseError) {
      return jsonResponse_({ ok: false, error: error.message }, 502);
    }
    return jsonResponse_({ ok: false, error: 'GASとの通信に失敗しました。' }, 502);
  }
}

function jsonResponse_(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
