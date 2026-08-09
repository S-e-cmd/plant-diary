# Project Status

Updated: 2026-08-09
Client build marker: `20260809-02`
Worker build marker: `2026-08-08-v22`

## Current state

- Cloudflare Pages deployment with no framework build step; `main` is the production branch.
- `_worker.js` is the same-origin `/api` boundary and delegates GAS transport/parsing to `worker/gas-transport.js`.
- Weather and browser-download responsibilities are already wired out of `index.html`.
- `client/log-date-utils.js`, `client/log-filter-utils.js`, and `client/quick-input-utils.js` are staged pure helpers. Runtime still uses the corresponding inline logic until guarded switching can be verified with full pre/post tests.
- Existing API, LocalStorage, DOM IDs, record formats, CSV behavior, and deployment contract remain unchanged.

## Completed alignment work

- Weather helper extraction and regression coverage: complete.
- Worker/GAS transport extraction and contract coverage: complete.
- Browser download extraction and regression coverage: complete.
- Log-date utility staging, semantic parity, fail-closed transform, dual-state tests, and runbook: complete; runtime switch not applied.
- Quick-input utility staging and semantic parity: complete; runtime switch not applied.
- Log search/filter/sort/paging utility staging: complete.
  - `client/log-filter-utils.js` contains `hasActiveSearch`, `matchesSearch`, `filterByDateRange`, `sortLogs`, and `paginateLogs`.
  - Searchable fields and special spray/liquid filter semantics mirror the current `renderLogs()` implementation.
  - Period filtering keeps the current rule that normal period views include records with `date` inside the selected range; `startDate` fallback remains search-only.
  - Ordering keeps the current `date || startDate || ''` key and `desc / asc` direction behavior.
  - Paging keeps a minimum of one page, clamps the requested page, and preserves the current 20-item page size at the caller/state boundary.
  - `scripts/test-log-filter-utils.mjs` covers representative filtering, ordering, range, and paging behavior.
  - `scripts/test-log-filter-semantic-parity.mjs` compares the staged helpers with reference functions copied from the current inline semantics.
  - `npm run test:log` now includes both log-filter tests.
  - Runtime wiring is intentionally deferred; `index.html` and Client Build remain `20260809-02`.

## Verification coverage

Unified maintenance entrypoint remains:

```bash
npm test
```

It covers handoff consistency, Worker/API contracts, client/static contracts, browser download behavior, log date/filter migration guards, quick-input semantics, and weather helpers.

A complete repository `npm test` still cannot be executed from the available connector-only environment. Runtime switches are therefore not claimed as applied or fully regression-verified.

## Protected contracts

- same-origin `/api` request/response behavior;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- log period/search/filter/sort/paging semantics;
- quick-input key/template/favorite semantics;
- Cloudflare Pages deployment from `main`.

## Remaining maintenance

- `index.html` remains the main maintainability risk because multiple rendering, event, storage, and orchestration responsibilities are still inline.
- Staged pure modules are not yet wired into runtime.
- Runtime wiring must remain guarded and separate from staging work until pre/post regression execution is available.
- Continue with small pure responsibilities rather than broad client rewrites or backend/storage migration.

## Current scope decision

- Current batch: complete.
- Production behavior change: none.
- Client build bump: not required; remains `20260809-02`.
- Overall maintenance: incomplete.
- Recommended next batch: stage another small pure helper boundary or strengthen guarded switch coverage without changing production runtime.
