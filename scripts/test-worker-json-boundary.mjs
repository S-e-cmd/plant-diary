import assert from 'node:assert/strict';

const moduleUrl = new URL('../_worker.js', import.meta.url);
moduleUrl.searchParams.set('json-boundary-test', String(Date.now()));
const { default: worker } = await import(moduleUrl.href);

const originalFetch = globalThis.fetch;
const request = body => new Request('https://example.test/api', { method: 'POST', body });
const json = async response => JSON.parse(await response.text());

try {
  for (const body of ['not-json', '{']) {
    let upstreamCalled = false;
    globalThis.fetch = async () => {
      upstreamCalled = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const response = await worker.fetch(request(body), {
      ASSETS: { fetch: originalFetch }
    });

    assert.equal(upstreamCalled, false);
    assert.equal(response.status, 400);
    assert.deepEqual(await json(response), {
      ok: false,
      error: '送信内容は正しいJSON形式で指定してください。'
    });
  }

  let upstreamCalled = false;
  globalThis.fetch = async () => {
    upstreamCalled = true;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const unsupported = await worker.fetch(request(JSON.stringify({ action: 'unknownAction' })), {
    ASSETS: { fetch: originalFetch }
  });

  assert.equal(upstreamCalled, false);
  assert.equal(unsupported.status, 400);
  assert.deepEqual(await json(unsupported), {
    ok: false,
    error: '未対応の操作です。'
  });

  console.log('ok - Worker malformed JSON and unsupported action boundary');
} finally {
  globalThis.fetch = originalFetch;
}
