# Architecture

Client build marker: `20260809-02`
Worker build marker: `2026-08-09-v23`

## Current structure

- `index.html` — single-page UI, styles, client state, rendering, form handling, log views, quick input, rotation display, bulk operations, CSV row/column selection, and API request orchestration.
- `client/weather-runtime.js` / `client/weather-utils.js` — active weather decision runtime and pure weather helpers.
- `client/download-utils.js` — active browser Blob download mechanics used by CSV export.
- `_worker.js` — Cloudflare Pages Worker entrypoint and same-origin `/api` boundary.
- `worker/gas-transport.js` — active GAS transport/parsing layer with a 25-second request timeout.
- `ai-context.json` / `llms.txt` / `docs/*` — maintenance and handoff context.

## Runtime flow

1. Cloudflare Pages serves `index.html` and static assets.
2. `startApp()` initializes the active weather and browser-download runtimes before bootstrap.
3. Browser operations call same-origin `/api`.
4. `_worker.js` validates `/api` requests and delegates GAS transport to `worker/gas-transport.js`.
5. GAS requests use `text/plain;charset=utf-8`, follow redirects, and are aborted after 25 seconds.
6. GAS timeout returns HTTP 504 with a retry-oriented JSON error. Invalid upstream JSON and other transport failures remain HTTP 502.
7. Non-API requests continue to use `env.ASSETS`.

## Responsibility boundaries to preserve

- Browser UI, event handling, LocalStorage, log/search/quick-input/rotation behavior remain in the current client runtime unless an actual runtime extraction is completed in the same batch.
- Weather and browser-download helpers remain active external modules.
- `_worker.js` remains the public API boundary; `worker/gas-transport.js` remains limited to upstream transport/parsing.
- Existing `/api`, LocalStorage keys, DOM IDs, record shapes, CSV format, and Cloudflare Pages deployment from `main` remain compatibility boundaries.

## Maintenance guidance

Do not add unused staged modules for possible future extraction. When a client responsibility is split out, complete the runtime wiring and required verification in the same maintenance flow, or leave the existing inline implementation as the sole source of truth.
