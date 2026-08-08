const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdwRh9gKVnNcRKQwvf22zuXBQLAM1pm4NuiXfPWIDdj884SWzlWIb4lGeu7XdSVPlcWQ/exec'; // build: 2026-08-08-v21
const API_PATH = '/api';
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
    const gasResponse = await fetchGas_(body);
    const data = await parseGasJson_(gasResponse);
    return json_(data, gasResponse.ok ? 200 : gasResponse.status);
  } catch (error) {
    if (error instanceof GasResponseError) {
      return json_({ ok: false, error: error.message }, 502);
    }

    return json_({
      ok: false,
      error: 'GASとの通信に失敗しました: ' + String(error?.message || error)
    }, 502);
  }
}

function fetchGas_(body) {
  return fetch(GAS_URL, {
    method: API_METHOD,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow'
  });
}

async function parseGasJson_(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new GasResponseError(
      'GASからJSONが返りませんでした。GASの再デプロイと公開範囲を確認してください。'
    );
  }
}

class GasResponseError extends Error {}

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
