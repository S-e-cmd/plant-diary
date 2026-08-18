# Architecture

Client build marker: `20260819-02`
Worker build marker: `2026-08-19-v31`

## Current structure

- `index.html` — single-page UI structure, shared client state, DOM rendering, form handling, UI event binding, modal handling, and API request orchestration.
- `styles.css` — active application stylesheet loaded directly by `index.html`.
- `client/weather-runtime.js` / `client/weather-utils.js` — weather decision runtime and pure weather helpers.
- `client/download-utils.js` — browser Blob download mechanics used by CSV export.
- `client/log-date-utils.js` / `client/log-list-utils.js` / `client/log-runtime.js` — log period boundaries, plan timing, search/filter, sort and pagination processing.
- `client/quick-input-utils.js` / `client/quick-input-runtime.js` — quick-input identity, template generation, favorite matching/mutation and recent-candidate grouping.
- `client/rotation-utils.js` / `client/rotation-runtime.js` — rotation detection, active frames, current/next/after display model and cyclic-next-cycle detection.
- `client/plan-bulk-utils.js` — bulk-plan request construction and real `YYYY-MM-DD` validation.
- `client/startup-loader.js` — startup-only fetch wrapper. It may return a same-day snapshot or request `bootstrapCore` for the first supported startup, then refresh full bootstrap in the background. Logs and subsequent/manual bootstrap calls remain full-data.
- `_worker.js` — Cloudflare Pages Worker entrypoint, same-origin `/api` boundary, static asset delegation, and startup-loader inlining into the HTML response.
- `worker/api-contract.js` — browser/GAS action-name and payload compatibility normalization.
- `worker/gas-transport.js` — GAS transport/parsing layer with a 25-second request timeout.
- `ai-context.json` / `llms.txt` / `docs/*` — maintenance and handoff context.

## Runtime flow

1. Cloudflare Pages receives the page request through `_worker.js`.
2. `_worker.js` loads the static HTML and inlines `client/startup-loader.js` before the application's existing inline script. The browser does not make a separate request for the startup loader.
3. The browser loads `styles.css` and runs the startup loader before the application script.
4. `startApp()` initializes weather, download, log, quick-input, rotation and bulk-plan client runtimes.
5. The first bootstrap request behaves by startup context:
   - Today / Input / Plans with a valid same-day snapshot: return the snapshot immediately and refresh full bootstrap in the background.
   - Today / Input / Plans without a valid snapshot: request `bootstrapCore`, return it first, and refresh full bootstrap in the background.
   - Logs: bypass partial startup data and request full bootstrap immediately.
6. Startup acceleration is consumed after that first bootstrap interception. Manual Sync and later bootstrap calls always request full bootstrap.
7. Browser operations call same-origin `/api`.
8. `_worker.js` validates the request; `worker/api-contract.js` normalizes compatibility aliases; `worker/gas-transport.js` performs the GAS request.
9. GAS requests use `text/plain;charset=utf-8`, follow redirects, and are aborted after 25 seconds.
10. GAS timeout returns HTTP 504. Invalid upstream JSON and other transport failures remain HTTP 502.
11. Non-API assets continue to use `env.ASSETS`.

## Data-processing ownership

`index.html` still owns DOM rendering and interaction orchestration, but it no longer owns all processing logic.

- Log range/search/sort/pagination → `log-runtime.js`
- Quick-input identity/candidates/favorite mutation → `quick-input-runtime.js`
- Rotation active-frame/display-model selection → `rotation-runtime.js`
- Bulk-plan payload validation/construction → `plan-bulk-utils.js`
- Weather risk/work-window decisions → `weather-runtime.js`
- Browser file-download mechanics → `download-utils.js`

Do not recreate those responsibilities inline in `index.html`.

## GAS ownership

GAS remains the source of truth for spreadsheet reads/writes and domain mutations, including:

- save/update/delete/restore;
- complete/postpone/cancel plan;
- cyclic rotation progression and `skipRotation`;
- summaries and analysis;
- calendar synchronization;
- bootstrap/full data construction.

Worker code may normalize transport names and validate required request fields, but must not emulate spreadsheet/domain behavior.

## Known UI wiring gap

The visible log buttons `履歴分析`, `資材・薬剤の使用履歴`, and `削除済みの記録` are not currently bound in `index.html`. This predates the runtime extraction. GAS already has the required contracts: `getAnalysis`, full-bootstrap `trash`, and `restore`. Treat this as client UI wiring work, not a reason to create parallel backend logic.

## Responsibility boundaries to preserve

- Application presentation CSS remains in `styles.css`.
- Existing `/api`, LocalStorage keys, DOM IDs, record shapes, CSV format, and Cloudflare Pages deployment from `main` remain compatibility boundaries.
- Client processing already extracted into runtime modules must remain there.
- UI rendering and DOM interaction may be extracted later only when the new runtime is wired in the same change; do not stage unused modules.
- Startup fetch interception remains startup-only and may not intercept manual Sync or Logs full-data loading.
- `_worker.js` remains the public API/static-delivery boundary; `worker/gas-transport.js` remains limited to upstream transport/parsing.
- GitHub Actions are not required for this maintenance flow.

## Maintenance guidance

Do not add unused staged modules for possible future extraction. When a client responsibility is split out, complete the runtime wiring and required verification in the same maintenance flow, or leave the existing active implementation as the sole source of truth.
