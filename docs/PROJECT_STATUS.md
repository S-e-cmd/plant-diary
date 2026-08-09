# Project Status

Updated: 2026-08-09
Client build marker: `20260809-02`
Worker build marker: `2026-08-08-v22`

## Current state

- Cloudflare Pages deployment with no framework build step.
- `main` is the production branch and deploys automatically.
- `_worker.js` is the same-origin `/api` boundary and delegates upstream GAS transport/parsing to `worker/gas-transport.js`.
- Weather decision helpers are separated from `index.html` through `client/weather-runtime.js` and `client/weather-utils.js`.
- Browser Blob download mechanics are separated into `client/download-utils.js`; CSV row selection, columns, filename pattern, and formatting remain unchanged.
- AI handoff files are present and reference the parent starter instead of copying shared protocol rules into this repository.

## Completed alignment work

### Weather responsibility extraction

- Weather naming, rain/wind risk, work-risk, plan-weather-kind, and safe-window helpers were moved out of the large inline client script.
- `startApp()` initializes the weather runtime before saved state restoration and `bootstrap()`.
- Existing weather thresholds, LocalStorage keys, DOM IDs, API payloads, and record formats were preserved.

### Worker/GAS transport extraction

- `_worker.js` retains route selection, request validation, status selection, JSON formatting, and static asset delegation.
- `worker/gas-transport.js` owns GAS HTTP transport and upstream JSON parsing.
- Existing `/api` route, POST/content-type/body behavior, response payload shape, cache headers, error messages, and GAS endpoint contract are preserved.

### Browser download utility extraction

- `client/download-utils.js` owns Blob construction, object URL creation, anchor download triggering, and URL cleanup.
- `index.html` dynamically initializes this utility alongside the weather runtime before normal startup.
- CSV export still owns only its existing data/formatting responsibility and calls the utility for the browser download step.
- Exported rows, CSV columns, BOM, line endings, filename pattern, MIME type, and user-facing completion message were not intentionally changed.

### Browser download regression guard

- `scripts/check-client-contract.mjs` verifies that `index.html` loads and initializes `client/download-utils.js` before bootstrap.
- The client contract check verifies that CSV export delegates to `downloadBrowserBlob()` and rejects reintroduction of direct `new Blob(...)` handling into `index.html`.
- `scripts/test-download-utils.mjs` directly verifies Blob content/MIME type, anchor creation, filename assignment, click triggering, and object URL cleanup.
- `npm test` includes `npm run test:download`.
- The download utility test was reproduced against the current utility implementation in an isolated Node ESM environment and passed. A full repository `npm test` was not executable from the connector-only repository environment in that batch.

### Log-view extraction guard

- The next client responsibility selected for incremental cleanup is the log/plan date and paging area rather than the full log renderer at once.
- `scripts/test-log-contract.mjs` now freezes the current 20-item page size, day/week/month period boundaries, overdue/today/future labels, plan `undated / overdue / today / future` classification, visible-log page calculation, sort direction behavior, and search-state shape.
- `npm test` includes `npm run test:log` so future extraction must preserve these behaviors before the inline functions are moved.
- The new test file itself was syntax-checked in Node. Its assertions were matched against the current `index.html` source during this batch; a full repository `npm test` was not executable from the connector-only repository environment.

## Verification coverage in repository

The unified maintenance check is:

```bash
npm test
```

It covers:

- handoff document consistency;
- Worker/API contract scenarios;
- client syntax and protected client contracts, including external `client/*.js` syntax and extracted-responsibility wiring;
- browser download utility behavior;
- log period/paging/plan-timing migration guards;
- weather utility/runtime/parity checks and extraction safeguards.

The Worker contract suite covers static delegation, `OPTIONS /api`, non-POST rejection, empty POST rejection, GAS request forwarding, valid JSON pass-through, invalid upstream JSON, and upstream transport failure.

## Protected contracts

Current maintenance must continue to preserve unless explicitly changed:

- same-origin `/api` and its current request/response behavior;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved client state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV export columns/format;
- log period semantics, paging size, search-state shape, sort direction, and plan timing classification;
- Cloudflare Pages deployment from `main`.

## Remaining maintenance

- `index.html` still contains multiple unrelated client responsibilities and remains the main maintainability risk.
- The log/plan date and paging behavior is now guarded and is the preferred next extraction target.
- Further extraction should remain incremental; rendering, event binding, API mutation, and pure date/paging logic should not be moved as one large batch.
- No broad rewrite, storage migration, backend replacement, route change, or template-shaped directory migration is justified by the current alignment work.

## Current scope decision

- Handoff synchronization with current `main`: complete.
- Weather helper extraction: complete.
- Worker/GAS transport extraction: complete and present on `main`.
- Browser download utility extraction: complete.
- Browser download regression guard: complete.
- Log-view extraction guard: complete.
- Major Change Planning: not applicable to the current maintenance scope.
- Recommended next batch: extract the now-guarded pure log/plan date and paging helpers from `index.html` without changing renderer, event, API, storage, or UI behavior.
