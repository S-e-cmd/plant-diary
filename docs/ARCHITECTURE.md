# Architecture

Build: `2026-07-19-v29`

## Current structure

- `index.html` — single-page UI, styles, client state, rendering, form handling, log views, weather display, rotation display, bulk operations, and API request orchestration.
- `_worker.js` — Cloudflare Pages Worker entrypoint. Serves static assets and proxies `POST /api` requests to the existing GAS Web App endpoint.
- `.github/workflows/notify-app-checker.yml` — manually triggered App Checker notification workflow. It is not a deployment workflow.

## Runtime flow

1. Cloudflare Pages serves `index.html` and other static repository assets.
2. Browser-side operations call same-origin `/api`.
3. `_worker.js` accepts only `POST` for `/api`, forwards the request body to GAS, parses the JSON response, and returns JSON with `Cache-Control: no-store`.
4. Requests outside `/api` are delegated to `env.ASSETS.fetch(request)`.

## Responsibility boundaries to preserve

- Browser UI and interaction logic remain client-side.
- GAS remains the existing data/API backend; its code and spreadsheet configuration are outside this repository.
- `_worker.js` is a thin transport boundary and must not absorb application business logic without an explicit requirement.
- Cloudflare Pages automatic deployment from `main` is the current publication method.

## Maintenance guidance

`index.html` is currently large and responsibility-heavy, but size alone is not evidence that a broad split is required. Future extraction should be limited to confirmed, cohesive responsibilities and must preserve DOM contracts, API payloads, storage keys, and observable UI behavior.
