# Architecture

Client build marker: `20260809-02`
Worker build marker: `2026-08-08-v22`

## Current structure

- `index.html` — single-page UI, styles, client state, rendering, form handling, log views, weather display, rotation display, bulk operations, CSV export, quick-input UI, and API request orchestration.
- `client/weather-runtime.js` — runtime adapter for weather decisions.
- `client/weather-utils.js` — extracted weather naming/risk/window helpers.
- `client/download-utils.js` — browser Blob download mechanics.
- `client/log-date-utils.js` — staged pure log/plan date helpers; not yet wired into runtime.
- `client/log-filter-utils.js` — staged pure log search, period filtering, ordering, and pagination helpers; not yet wired into runtime.
- `client/quick-input-utils.js` — staged quick-input key/template/favorite helpers; not yet wired into runtime.
- `_worker.js` — Cloudflare Pages Worker entrypoint and same-origin `/api` boundary.
- `worker/gas-transport.js` — GAS endpoint transport and upstream JSON parsing.
- `.github/workflows/notify-app-checker.yml` — manually triggered App Checker notification workflow, not deployment.
- `ai-context.json` / `llms.txt` / `docs/*` — local maintenance and handoff context.

## Runtime flow

1. Cloudflare Pages serves `index.html` and static assets.
2. `startApp()` initializes `client/weather-runtime.js` and `client/download-utils.js` before saved state restoration and `bootstrap()`.
3. Browser operations call same-origin `/api`.
4. `_worker.js` delegates non-API requests to `env.ASSETS` and validated API transport to `worker/gas-transport.js`.
5. CSV browser download uses `client/download-utils.js`.
6. Log date, log filter/page, and quick-input pure helpers still run from current inline functions in `index.html`; staged modules are not production runtime dependencies yet.

## Responsibility boundaries to preserve

- Browser UI and event handling remain client-side.
- Weather helper extraction preserves existing thresholds and decisions.
- Browser download mechanics remain isolated from CSV row/column selection.
- Log-date extraction preserves day/week/month boundaries, Monday-to-Sunday week handling, relative-day labels, and plan timing classification.
- Log-filter extraction preserves searchable fields, date fallback (`date` then `startDate`), spray/liquid special filters, sort key/direction, date-range behavior requiring `date`, and 20-item paging semantics.
- Quick-input extraction preserves key field order/trimming, default `その他`, `qid` reuse/generated-ID behavior, and favorite equality semantics.
- GAS remains the existing backend; `_worker.js` remains a thin public transport boundary.
- Existing `/api`, LocalStorage keys, DOM IDs, record shapes, CSV format, and Cloudflare Pages `main` deployment remain compatibility boundaries.

## Maintenance guidance

`index.html` remains responsibility-heavy. Continue extracting cohesive pure logic in small batches and keep runtime wiring separate from utility staging when full pre/post regression execution is unavailable.

The staged log-date switch uses `scripts/log-date-extraction-transform.mjs` as an exact-match fail-closed transform. Quick-input and log-filter modules currently have unit/semantic-parity tests only and must not be manually wired by broad replacement.
