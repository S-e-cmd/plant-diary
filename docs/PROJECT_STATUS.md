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
- `client/log-date-utils.js` contains staged pure helpers for log period boundaries, relative-day labels, and plan timing classification. Runtime still uses the current inline functions until the guarded switch is applied.
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

### Log-view extraction guard and staged utility

- `scripts/test-log-contract.mjs` freezes the current 20-item page size, day/week/month period boundaries, overdue/today/future labels, plan `undated / overdue / today / future` classification, visible-log page calculation, sort direction behavior, and search-state shape.
- `client/log-date-utils.js` stages only the pure date-related part: `dateRange`, `dayDistance`, and `planTiming` plus their date-format helpers.
- `scripts/test-log-date-utils.mjs` checks representative day/week/month boundaries, precedence rules, relative-day labels, and plan timing states.
- `scripts/test-log-date-semantic-parity.mjs` compares the staged module against the current inline implementation across month/year boundaries and representative plan/date combinations.
- `scripts/log-date-extraction-transform.mjs` defines a fail-closed exact-match transform for the eventual runtime switch. It refuses to continue when the current source differs or a target fragment is non-unique.
- `scripts/test-log-date-extraction-dry-run.mjs` supports both staged and switched states and verifies that the switched source removes the three inline helpers, initializes `client/log-date-utils.js`, updates the client build marker to `20260809-03`, and remains parsable.
- `scripts/apply-log-date-extraction.mjs` is the single apply entrypoint and `npm run maintenance:apply-log-date-extraction` exposes it.
- `scripts/test-log-contract.mjs` now supports both staged and switched states while continuing to enforce paging/search/sort contracts.
- `docs/LOG_DATE_EXTRACTION_RUNBOOK.md` records required pre-check, apply, post-check, and rollback steps.
- `npm run test:log` includes the contract, utility, semantic-parity, and dry-run checks.

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
- log period/paging/plan-timing migration guards, staged utility behavior, semantic parity, and extraction dry-run;
- weather utility/runtime/parity checks and extraction safeguards.

A full repository `npm test` cannot currently be executed from the available connector-only environment because a local checkout cannot reach GitHub. A temporary GitHub Actions execution path was also attempted on an isolated branch, but workflow runs were not triggered through the current connection path; the temporary workflow was removed and was not merged. Therefore the runtime switch is not claimed as verified or applied.

## Protected contracts

Current maintenance must continue to preserve unless explicitly changed:

- same-origin `/api` and its current request/response behavior;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved client state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV export columns/format;
- log period semantics, 20-item paging size, search-state shape, sort direction, and plan timing classification;
- Cloudflare Pages deployment from `main`.

## Remaining maintenance

- `index.html` still contains multiple unrelated client responsibilities and remains the main maintainability risk.
- The log-date module is staged but is not yet wired into runtime; the current inline `dateRange`, `dayDistance`, and `planTiming` remain active.
- Runtime switching must use `npm run maintenance:apply-log-date-extraction` and the required pre/post `npm test` checks rather than manual broad replacement.
- Further extraction should remain incremental; rendering, event binding, API mutation, and pure date/paging logic should not be moved as one large batch.
- No broad rewrite, storage migration, backend replacement, route change, or template-shaped directory migration is justified by the current alignment work.

## Current scope decision

- Handoff synchronization with current `main`: complete.
- Weather helper extraction: complete.
- Worker/GAS transport extraction: complete and present on `main`.
- Browser download utility extraction: complete.
- Browser download regression guard: complete.
- Log-view extraction guard: complete.
- Log-date pure utility staging and semantic parity: complete.
- Guarded runtime-switch command, dual-state tests, and runbook: complete and present on `main`.
- Runtime switch to `client/log-date-utils.js`: not yet applied because neither a complete local checkout nor a triggerable repository execution path is available in the current environment.
- Major Change Planning: not applicable to the current maintenance scope.
- Recommended next batch: execute the prepared fail-closed log-date extraction in an environment that can run the repository checkout, run `npm test` before and after, and only then promote the client build to `20260809-03`.
