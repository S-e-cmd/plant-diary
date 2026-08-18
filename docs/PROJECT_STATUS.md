# Project Status

Updated: 2026-08-19
Client build marker: `20260819-02`
Worker build marker: `2026-08-19-v30`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application CSS is active in `styles.css`; `index.html` does not recreate the application stylesheet inline.
- Startup acceleration is active in the delivered HTML path. `_worker.js` injects synchronous `client/startup-loader.js` before the existing application inline script.
- First launch without a same-day snapshot requests `bootstrapCore` first and starts the full `bootstrap` in the background. Repeated same-day launches of Today / Input / Plans use the saved startup snapshot immediately and refresh full data in the background. Logs remains full-data only.
- Startup fetch ownership is single-path: `startup-loader.js` is the only startup fetch wrapper. The superseded `startup-runtime.js` / `startup-snapshot.js` path was removed to prevent double wrapping and duplicate refresh requests.
- The current GAS deployment supports `bootstrapCore` and full `bootstrap`; Worker transport points to the two-stage GAS deployment supplied on 2026-08-19.
- Weather decision helpers and browser-download mechanics remain active external client modules.
- Log processing is now active runtime code: `log-date-utils.js` / `log-list-utils.js` own pure operations and `log-runtime.js` owns state-bound range, timing, filtering, sorting and pagination. `index.html` delegates its log list processing to this runtime.
- Quick-input processing is now active runtime code: `quick-input-utils.js` / `quick-input-runtime.js` own identity, template generation, favorite matching, recent candidate grouping and favorite mutation. `index.html` retains only DOM rendering, LocalStorage persistence and input-screen navigation.
- Rotation processing is now active runtime code: `rotation-utils.js` / `rotation-runtime.js` own rotation detection and current / next / after display-model selection with execution-history count. `index.html` retains only rendering and API interaction.
- Bulk-plan request construction is now active runtime code: `plan-bulk-utils.js` validates selected IDs and real `YYYY-MM-DD` dates and builds complete / postpone / cancel payloads. Browser UI still collects the date; Worker independently validates postpone dates again.
- Worker/GAS transport responsibilities remain split. Browser `parse / calendar / calendarBulk / bulkPlans` normalize to GAS `analyze / syncPlanCalendar / syncAllPlansCalendar / batchPlans` at the Worker boundary.
- `skipRotation` passes through unchanged so GAS retains rotation mutation ownership.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504. Invalid GAS JSON and ordinary transport failures remain on HTTP 502 paths.
- Local handoff continues through the current parent starter `START_HERE.md`; existing application contracts and deployment architecture remain protected.

## Verification

- `scripts/check-client-contract.mjs` syntax-checks inline/client JavaScript, protects CSS, DOM, LocalStorage and `/api` contracts, requires active imports of weather/download/log/quick/rotation/bulk-plan modules, and verifies the page delegates log grouping/pagination, quick-input grouping/favorite mutation, rotation view-model selection and bulk payload creation to the external runtimes.
- The same client contract rejects recreation of the former quick-input grouping, log filtering/pagination and rotation selection logic inline.
- `scripts/test-startup-loader.mjs` verifies first-run `bootstrapCore`, background full bootstrap and snapshot behavior. Obsolete duplicate startup-runtime/snapshot tests were removed with the duplicate implementation.
- `scripts/test-log-contract.mjs` / `scripts/test-log-runtime.mjs` cover daily/weekly/monthly ranges, overdue/today/future timing, search and special filters, period filtering, sorting and 20-item pagination.
- `scripts/test-quick-input-utils.mjs` / `scripts/test-quick-input-runtime.mjs` cover identity order, template defaults, favorite matching/mutation, duplicate suppression, newest-first ordering and result limits.
- `scripts/test-rotation-utils.mjs` / `scripts/test-rotation-runtime.mjs` cover rotation detection, active-frame selection, current/next/after model, execution-history count and cyclic next-cycle requirement.
- `scripts/test-plan-bulk-utils.mjs` covers ID normalization, real calendar-date validation and complete/postpone/cancel payloads.
- `scripts/test-api-contract.mjs` and `scripts/test-worker-contract.mjs` protect browser-to-GAS normalization and fail-closed postpone-date behavior.
- Focused startup / log / quick-input / rotation / plan-bulk / API-contract checks remain in the normal `npm test` sequence. GitHub Actions are not required.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and spreadsheet mutation ownership;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- log search-state shape and 20-item page size;
- quick-input identity field order and favorite/recent semantics;
- cyclic rotation history remains append-only across cycles;
- `skipRotation` is not equivalent to ordinary cancellation;
- bulk postpone requires a caller-supplied real `YYYY-MM-DD` date; no layer invents a date;
- runtime modules own data processing only, not unrelated DOM rendering or GAS business logic;
- startup snapshots are same-day only and are not used as complete Logs data;
- startup loader injection occurs before the existing inline application script;
- active stylesheet boundary remains `styles.css`;
- Cloudflare Pages deployment remains from `main`.

## Current maintenance decision

- Startup performance: two-stage startup active; duplicate startup fetch wrapper removed.
- CSS responsibility extraction: complete and active.
- Log runtime delegation: complete and active in `index.html`.
- Quick-input runtime delegation: complete and active in `index.html`.
- Rotation runtime delegation: complete and active in `index.html`.
- Bulk-plan request delegation: complete and active in `index.html`.
- UI rendering, DOM bindings and LocalStorage remain in `index.html`; extracted runtimes do not absorb those responsibilities.
- A cyclic rotation still requires GAS to generate the next cycle after the final active frame.
- Client build is `20260819-02` after active runtime delegation.
- Worker build remains `2026-08-19-v30`.
