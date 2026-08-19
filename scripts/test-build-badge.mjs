import assert from 'node:assert/strict';

const moduleUrl = new URL('../_worker.js', import.meta.url);
moduleUrl.searchParams.set('buildBadgeTest', String(Date.now()));
const { default: worker } = await import(moduleUrl.href);

const htmlSource = '<!doctype html>\n<!-- build: 20260819-03 / Today render contract -->\n<header class="header"><h1>植物栽培管理日誌</h1></header><script>globalThis.__app=true;</script>';
const env = {
  ASSETS: {
    fetch: async req => {
      const path = new URL(req.url).pathname;
      if (path === '/client/startup-loader.js') {
        return new Response('globalThis.__startup=true;', { headers: { 'Content-Type': 'application/javascript' } });
      }
      return new Response(htmlSource, { headers: { 'Content-Type': 'text/html' } });
    }
  }
};

const response = await worker.fetch(new Request('https://example.test/'), env);
const html = await response.text();
assert.match(html, /植物栽培管理日誌 <span data-client-build[^>]*>20260819-03<\/span>/);
assert.equal((html.match(/data-client-build/g) || []).length, 1);
assert.equal(response.headers.get('cache-control'), 'no-store');

console.log('visible build badge: ok');
