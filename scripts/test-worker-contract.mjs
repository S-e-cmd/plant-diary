import assert from 'node:assert/strict';

const moduleUrl = new URL('../_worker.js', import.meta.url);
moduleUrl.searchParams.set('test', String(Date.now()));
const { default: worker } = await import(moduleUrl.href);

const originalFetch = globalThis.fetch;
const request = (path, init = {}) => new Request(`https://example.test${path}`, init);
const json = async response => JSON.parse(await response.text());

async function run(name, test) {
  try {
    await test();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

try {
  await run('non-api requests are delegated to static assets', async () => {
    let delegated = false;
    const env = {
      ASSETS: {
        fetch: async req => {
          delegated = req.url.endsWith('/asset.css');
          return new Response('asset', { status: 200 });
        }
      }
    };

    const response = await worker.fetch(request('/asset.css'), env);
    assert.equal(delegated, true);
    assert.equal(await response.text(), 'asset');
  });

  await run('OPTIONS /api returns 204 without upstream fetch', async () => {
    globalThis.fetch = async () => {
      throw new Error('upstream should not be called');
    };

    const response = await worker.fetch(
      request('/api', { method: 'OPTIONS' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });

  await run('non-POST /api returns 405', async () => {
    const response = await worker.fetch(
      request('/api', { method: 'GET' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 405);
    assert.deepEqual(await json(response), {
      ok: false,
      error: 'POSTのみ利用できます。'
    });
  });

  await run('empty POST /api returns 400', async () => {
    const response = await worker.fetch(
      request('/api', { method: 'POST', body: '' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await json(response), {
      ok: false,
      error: '送信内容が空です。'
    });
  });

  for (const date of [undefined, '2026-8-21', '2026-02-29']) {
    await run(`invalid bulk postpone date ${String(date)} returns 400 before upstream fetch`, async () => {
      let called = false;
      globalThis.fetch = async () => {
        called = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const payload = { action: 'bulkPlans', ids: ['p1'], operation: 'postpone' };
      if (date !== undefined) payload.date = date;
      const response = await worker.fetch(
        request('/api', { method: 'POST', body: JSON.stringify(payload) }),
        { ASSETS: { fetch: originalFetch } }
      );

      assert.equal(called, false);
      assert.equal(response.status, 400);
      assert.deepEqual(await json(response), {
        ok: false,
        error: '一括延期には有効な延期後の日付（YYYY-MM-DD）が必要です。'
      });
    });
  }

  await run('valid GAS JSON is passed through with upstream status and timeout signal', async () => {
    let upstream;
    globalThis.fetch = async (url, init) => {
      upstream = { url, init };
      return new Response(
        JSON.stringify({ ok: true, data: { value: 1 } }),
        { status: 200 }
      );
    };

    const body = JSON.stringify({ action: 'bootstrap' });
    const response = await worker.fetch(
      request('/api', { method: 'POST', body }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 200);
    assert.equal(upstream.init.method, 'POST');
    assert.equal(upstream.init.headers['Content-Type'], 'text/plain;charset=utf-8');
    assert.equal(upstream.init.body, body);
    assert.equal(upstream.init.signal instanceof AbortSignal, true);
    assert.deepEqual(await json(response), {
      ok: true,
      data: { value: 1 }
    });
  });

  await run('invalid GAS JSON returns the existing 502 contract', async () => {
    globalThis.fetch = async () => new Response('<html>not json</html>', { status: 200 });

    const response = await worker.fetch(
      request('/api', { method: 'POST', body: '{}' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await json(response), {
      ok: false,
      error: 'GASからJSONが返りませんでした。GASの再デプロイと公開範囲を確認してください。'
    });
  });

  await run('GAS timeout returns 504 with explicit retry guidance', async () => {
    globalThis.fetch = async () => {
      throw new DOMException('timed out', 'TimeoutError');
    };

    const response = await worker.fetch(
      request('/api', { method: 'POST', body: '{}' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 504);
    assert.deepEqual(await json(response), {
      ok: false,
      error: 'GASの応答がタイムアウトしました。時間をおいて再度お試しください。'
    });
  });

  await run('upstream fetch failure returns the existing 502 contract', async () => {
    globalThis.fetch = async () => {
      throw new Error('network down');
    };

    const response = await worker.fetch(
      request('/api', { method: 'POST', body: '{}' }),
      { ASSETS: { fetch: originalFetch } }
    );

    assert.equal(response.status, 502);
    assert.deepEqual(await json(response), {
      ok: false,
      error: 'GASとの通信に失敗しました: network down'
    });
  });
} finally {
  globalThis.fetch = originalFetch;
}
