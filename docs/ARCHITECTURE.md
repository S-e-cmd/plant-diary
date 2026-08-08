# Architecture

Client build marker: `2026-07-19-v29`
Worker build marker: `2026-08-08-v21`

## Current structure

- `index.html` — single-page UI, styles, client state, rendering, form handling, log views, weather display, rotation display, bulk operations, and API request orchestration.
- `_worker.js` — Cloudflare Pages Worker entrypoint. Serves static assets and provides the same-origin `/api` transport to the existing GAS Web App endpoint.
- `.github/workflows/notify-app-checker.yml` — manually triggered App Checker notification workflow. It is not a deployment workflow.
- `ai-context.json` / `llms.txt` / `docs/*` — local maintenance and handoff context for future development.

## Runtime flow

1. Cloudflare Pages serves `index.html` and other static repository assets.
2. Browser-side operations call same-origin `/api`.
3. `_worker.js` routes non-API requests directly to `env.ASSETS`.
4. `/api` requests are handled by the Worker API boundary.
5. `OPTIONS` returns the existing 204 response; non-POST methods return the existing 405 JSON response.
6. Valid POST bodies are forwarded to GAS as `text/plain;charset=utf-8` with redirects followed.
7. GAS response text is parsed as JSON and returned with the upstream success/status behavior already used by the app.
8. Invalid GAS JSON and transport failures remain separate error paths and return 502 JSON responses.

## Worker responsibility split

`_worker.js` keeps transport concerns separate without changing the external route contract:

- `fetch` — route selection only.
- `handleApiRequest_` — `/api` method/body validation and response orchestration.
- `fetchGas_` — upstream GAS transport.
- `parseGasJson_` — upstream response parsing.
- `json_` / `apiHeaders_` — response formatting.

Business logic remains outside the Worker.

## Responsibility boundaries to preserve

- Browser UI and interaction logic remain client-side.
- GAS remains the existing data/API backend; its code and spreadsheet configuration are outside this repository.
- `_worker.js` remains a thin transport boundary and must not absorb application business logic without an explicit requirement.
- Cloudflare Pages automatic deployment from `main` is the current publication method.
- Existing `/api` path, accepted POST behavior, GAS request format, JSON response structure, and static asset delegation are compatibility boundaries.

## Maintenance guidance

`index.html` is currently large and responsibility-heavy. Because code maintenance is an explicit task, cohesive responsibilities may be extracted incrementally when their dependencies and DOM/API/storage contracts can be confirmed. Broad rewriting or template-shaped directory migration is still out of scope.
