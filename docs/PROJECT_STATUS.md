# Project Status

Updated: 2026-08-08
Client build marker: `2026-07-19-v29`
Worker build marker: `2026-08-08-v21`

## Confirmed current state

- Existing app is a Cloudflare Pages deployment with no framework build step.
- `index.html` contains the deployed client application and its current client build marker.
- `_worker.js` exposes the existing `/api` transport to GAS and delegates other requests to static assets.
- `main` is the production branch and Cloudflare Pages deployment is automatic from repository changes.
- The App Checker GitHub Actions workflow is manual-only and is not used for deployment.
- Local AI handoff and maintenance documents are present.

## Maintenance batches completed on 2026-08-08

### Batch 1 — handoff baseline

Added `ai-context.json`, `llms.txt`, and local architecture/data/UI/status documents without changing runtime behavior.

### Batch 2 — Worker responsibility split

Refactored `_worker.js` while preserving the external `/api` contract. Route selection, API handling, GAS transport, and GAS JSON parsing were separated. Worker build marker was updated to `2026-08-08-v21`.

### Batch 3 — regression safety checks

Added `scripts/test-worker-contract.mjs` and `scripts/check-client-contract.mjs`. The Worker contract test was executed and all seven checks passed.

### Batch 4 — current starter re-check

Re-read the current `app-starter-template`, including the Major Change Planning gate. Current maintenance remains Existing App Alignment: file size, file count, and multiple responsibilities alone do not require Major Change Planning, and no confirmed storage/auth/API/deployment transition currently requires it.

Added `package.json` as a runtime-neutral maintenance entry point without package dependencies or a build step.

### Batch 5 — extraction-ready client guard

Strengthened `scripts/check-client-contract.mjs` so it can follow both inline JavaScript and future `client/*.js` files while preserving LocalStorage, DOM, API, weather, and bootstrap contracts.

The available execution environment could not retrieve a GitHub checkout, so this strengthened checker remains implemented but not reported as executed.

### Batch 6 — staged weather extraction

Prepared the first real client responsibility extraction without switching the deployed runtime yet.

Added:

- `client/weather-utils.js` — pure weather naming, rain/wind risk, work-risk, weather-sensitive-plan, plan-weather-kind, and safe-window helpers;
- `scripts/test-weather-utils.mjs` — direct contract tests for the staged pure functions;
- `scripts/test-weather-parity.mjs` — guard that confirms the current inline source is still present and the staged module remains inactive until the runtime-switch batch;
- `client/README.md` and `scripts/README.md` — handoff notes for staged extraction and checks.

Updated `package.json` so `npm test` includes Worker, client, and staged weather checks.

The staged weather module is intentionally **not referenced by `index.html` yet**. Therefore this batch changes repository maintenance code but not the deployed client behavior, client build marker, DOM, state shape, LocalStorage keys, API payloads, storage format, or backend contract.

A SHA conflict was encountered while updating `package.json`; the current file was re-fetched and the intended script change was reapplied without overwriting concurrent content, following the starter concurrency policy.

### Batch 7 — weather runtime compatibility adapter

Added a thin compatibility boundary for the future runtime switch without activating it yet.

- `client/weather-runtime.js` exposes the current weather helper call signatures while delegating pure calculations to `client/weather-utils.js`.
- The adapter reads `weatherRules` and `forecastHourly` through a state getter rather than taking a stale snapshot, preserving the current dynamic settings behavior.
- `scripts/test-weather-runtime.mjs` verifies the adapter contract, including that later state mutations are observed.
- `package.json` now runs the pure utility test, runtime adapter test, and staged parity guard together under `npm run test:weather`.

`index.html` still does not import the staged weather files, so deployed client runtime behavior remains unchanged in batch 7 and the client build marker remains `2026-07-19-v29`.

## Confirmed client maintenance observations

Confirmed responsibilities currently co-located in `index.html` include:

- client state and LocalStorage-backed UI preferences/drafts;
- same-origin API client and bootstrap orchestration;
- weather and forecast handling;
- rendering for pinned information, logs, plans, outlook, rotation, and quick input;
- plan/actual record editing and bulk operations;
- UI event wiring.

The weather helper group remains the first staged extraction because its core logic is now isolated as pure functions plus a narrow runtime adapter without changing storage, API payloads, DOM IDs, or backend contracts.

## Verification status

- Current Worker source after refactor: verified from repository state.
- Existing Worker transport contract: verified by executable regression test, seven checks passed.
- Existing `/api` route/method/body/upstream/response contract: verified.
- Current parent starter Major Change rules: verified against current repository state.
- Major Change Planning requirement for current maintenance: not-applicable based on currently confirmed scope and contracts.
- Staged `client/weather-utils.js`: repository content verified; runtime inactive by design.
- Staged `client/weather-runtime.js`: repository content verified; runtime inactive by design.
- Weather utility/runtime/parity checks: implemented; execution pending because the available environment cannot run against a repository checkout.
- Client static contract checker: implemented and strengthened; execution pending, not counted as verified.
- Production browser regression: not required for batch 7 because deployed client runtime was intentionally unchanged.
- External GAS/spreadsheet internals: unchanged and outside this maintenance batch.

## Current scope decision

- Maintenance need: medium.
- Scope completion: incomplete.
- Recommended action: continue.
- Major Change Planning: not-applicable.
- Reason: the first client responsibility is staged with both pure helpers and a compatibility adapter. The next runtime step can be limited to wiring this adapter into the existing client while preserving current function signatures and contracts.

## Next maintenance batch

- execute `npm test` against a repository checkout when execution becomes available;
- switch only the staged weather helper responsibility into the deployed client through the compatibility adapter;
- preserve current function behavior, state shape, thresholds, DOM IDs, LocalStorage keys, API payloads, and UI behavior;
- update the client build marker because that switch changes deployed client assets;
- re-run Worker/client/weather checks after the switch before any further extraction.
