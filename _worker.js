import { GasResponseError, GasTimeoutError, fetchGas, parseGasJson } from './worker/gas-transport.js';

const API_PATH = '/api'; // build: 2026-08-09-v23
const API_METHOD = 'POST';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== API_PATH) {
      return env.ASSETS.fetch(request);
    }

    return handleApiRequest_(request);
  }
};

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
    const gasResponse = await fetchGas(body);
    const data = await parseGasJson(gasResponse);
    return json_(data, gasResponse.ok ? 200 : gasResponse.status);
  } catch (error) {
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
