# Architecture

Client build marker: `20260809-02`
Worker build marker: `2026-08-08-v22`

## Current structure

- `index.html` — single-page UI, styles, client state, rendering, form handling, log views, weather display, rotation display, bulk operations, CSV export, and API request orchestration.
- `client/weather-runtime.js` — runtime adapter that exposes the existing weather helper names while delegating calculations to `client/weather-utils.js` and reading live client state.
- `client/weather-utils.js` — extracted weather naming, rain/wind risk, work-risk, plan-weather-kind, and safe-window decision helpers.
- `client/download-utils.js` — browser Blob download creation, temporary object URL management, and cleanup for CSV export.
- `_worker.js` — Cloudflare Pages Worker entrypoint. Serves static assets and owns same-origin `/api` routing, request validation, and API response formatting.
- `worker/gas-transport.js` — GAS endpoint transport and upstream JSON parsing. It preserves the existing POST/content-type/redirect and invalid-JSON behavior.
- `.github/workflows/notify-app-checker.yml` — manually triggered App Checker notification workflow. It is not a deployment workflow.
- `ai-context.json` / `llms.txt` / `docs/*` — local maintenance and handoff context for future development.

## Runtime flow

1. Cloudflare Pages serves `index.html` and other static repository assets.
2. `startApp()` initializes both `client/weather-runtime.js` and `client/download-utils.js` before restoring saved tab/draft state and running `bootstrap()`.
3. Browser-side operations call same-origin `/api`.
4. `_worker.js` routes non-API requests directly to `env.ASSETS`.
5. `/api` requests are validated and orchestrated by `_worker.js`.
6. `OPTIONS` returns the existing 204 response; non-POST methods return the existing 405 JSON response.
7. Valid POST bodies are passed to `worker/gas-transport.js`.
8. The GAS transport sends `text/plain;charset=utf-8` with redirects followed and parses the upstream response as JSON.
9. `_worker.js` returns the parsed JSON with the existing upstream success/status behavior.
10. Invalid GAS JSON and transport failures remain separate error paths and return the existing 502 JSON responses.
11. CSV export remains browser-side and calls `downloadBrowserBlob()` from `client/download-utils.js`; record selection, CSV columns, filename pattern, and formatting are unchanged.

## Worker responsibility split

`_worker.js` keeps the public Worker/API boundary:

- `fetch` — route selection.
- `handleApiRequest_` — `/api` method/body validation and response orchestration.
- `json_` / `apiHeaders_` — response formatting.

`worker/gas-transport.js` owns upstream GAS concerns:

- `fetchGas` — GAS HTTP transport.
- `parseGasJson` — upstream response parsing.
- `GasResponseError` — invalid upstream JSON classification.

Business logic remains outside the Worker and transport module.

## Responsibility boundaries to preserve

- Browser UI and interaction logic remain client-side.
- Weather decision helpers remain separated behind the current `weather-runtime.js` adapter unless a future explicit change requires otherwise.
- Browser download mechanics remain isolated in `client/download-utils.js`; CSV data selection/formatting remains with the log/export responsibility until explicitly separated.
- GAS remains the existing data/API backend; its code and spreadsheet configuration are outside this repository.
- `_worker.js` remains a thin public transport boundary and must not absorb application business logic without an explicit requirement.
- `worker/gas-transport.js` remains limited to upstream GAS transport/parsing and must not absorb browser/UI or application business rules.
- Cloudflare Pages automatic deployment from `main` is the current publication method.
- Existing `/api` path, accepted POST behavior, GAS request format, JSON response structure, and static asset delegation are compatibility boundaries.
- Existing LocalStorage keys, DOM IDs, record shapes, and CSV columns/format are compatibility boundaries unless an explicit scoped change requires otherwise.

## Maintenance guidance

`index.html` is currently large and responsibility-heavy. Because code maintenance is an explicit task, cohesive responsibilities may be extracted incrementally when their dependencies and DOM/API/storage contracts can be confirmed. Broad rewriting or template-shaped directory migration is still out of scope.
