import assert from 'node:assert/strict';
import { requestApi } from '../client/api-client.js';

const calls = [];
const okFetch = async (url, init) => {
  calls.push({ url, init });
  return new Response(JSON.stringify({ ok: true, data: { value: 1 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

assert.deepEqual(await requestApi({ action: 'test' }, { fetchImpl: okFetch }), { value: 1 });
assert.equal(calls[0].url, '/api');
assert.equal(calls[0].init.method, 'POST');
assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
assert.equal(calls[0].init.body, JSON.stringify({ action: 'test' }));

await assert.rejects(
  requestApi({ action: 'bad' }, {
    fetchImpl: async () => new Response(JSON.stringify({ ok: false, error: '失敗' }), { status: 400 })
  }),
  /失敗/
);

await assert.rejects(
  requestApi({ action: 'bad-json' }, {
    fetchImpl: async () => new Response('<html>bad</html>', { status: 200 })
  }),
  /APIから正しい応答が返りませんでした。/
);

console.log('ok - shared client API helper');
