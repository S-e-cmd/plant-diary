const GAS_URL = 'https://script.google.com/macros/s/AKfycbxD1Ok_JRVlY2ZhggzEv4PgH3VlRB7nUBrTzjRzDwc0U9geu3NGrC1RIPOOcbF4kKOmDQ/exec'; // build: 2026-07-19-v17

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: apiHeaders_() });
      }

      if (request.method !== 'POST') {
        return json_({ ok: false, error: 'POSTのみ利用できます。' }, 405);
      }

      try {
        const body = await request.text();
        if (!body) return json_({ ok: false, error: '送信内容が空です。' }, 400);

        const gasResponse = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body,
          redirect: 'follow'
        });

        const text = await gasResponse.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (error) {
          return json_({
            ok: false,
            error: 'GASからJSONが返りませんでした。GASの再デプロイと公開範囲を確認してください。'
          }, 502);
        }

        return json_(data, gasResponse.ok ? 200 : gasResponse.status);
      } catch (error) {
        return json_({ ok: false, error: 'GASとの通信に失敗しました: ' + String(error.message || error) }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

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
