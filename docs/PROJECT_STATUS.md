# Project Status

Updated: 2026-08-19
Client page marker: `20260819-02`
Worker build marker: `2026-08-19-v31`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application CSS is active in `styles.css`; `index.html` does not recreate the application stylesheet inline.
- Startup acceleration is active in the delivered HTML path. `_worker.js` reads `client/startup-loader.js` from static assets and inlines it before the existing application script, removing an extra browser request.
- Startup acceleration applies only to the first bootstrap request in a page session. Today / Input / Plans may use a same-day snapshot or `bootstrapCore` for first display, then refresh full data in the background.
- Logs bypasses partial startup data and performs a full bootstrap immediately. Later manual Sync requests also perform full bootstrap.
- `startup-loader.js` is the only startup fetch wrapper. The superseded duplicate startup path remains removed.
- Background full-bootstrap refresh now hands `weather`, `forecasts`, and `forecastHourly` through the active weather runtime before `applyBootstrap`. This closes the previous gap where ordinary bootstrap refreshed forecast state but background startup refresh could leave forecast data at snapshot/core values.
- The current GAS deployment supports `bootstrapCore` and full `bootstrap`; Worker transport points to the two-stage GAS deployment supplied on 2026-08-19.
- Weather decision helpers and browser-download mechanics remain active external client modules.
- Log processing is active runtime code: `log-date-utils.js` / `log-list-utils.js` own pure operations and `log-runtime.js` owns state-bound range, timing, filtering, sorting and pagination.
- Log utility UI is active through `log-tools-ui.js`, installed by the already-active `log-runtime` initialization. `履歴分析` uses GAS `getAnalysis`; `資材・薬剤の使用履歴` renders the `usage` portion of that analysis; `削除済みの記録` explicitly requests a full `bootstrap` before rendering `trash`; each restore action uses GAS `restore` and applies the returned refreshed bootstrap.
- Quick-input processing is active runtime code through `quick-input-utils.js` / `quick-input-runtime.js`.
- Rotation processing is active runtime code through `rotation-utils.js` / `rotation-runtime.js`.
- Bulk-plan request construction is active runtime code through `plan-bulk-utils.js`; Worker independently validates postpone dates again.
- Worker/GAS transport responsibilities remain split. Browser `parse / calendar / calendarBulk / bulkPlans` normalize to GAS `analyze / syncPlanCalendar / syncAllPlansCalendar / batchPlans` at the Worker boundary.
- `skipRotation` passes through unchanged so GAS retains rotation mutation ownership.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504. Invalid GAS JSON and ordinary transport failures remain HTTP 502.
- A pre-existing Today-tab rendering bug remains identified: `renderActiveTab()` calls `renderOutlook()` before `renderToday()`, and `renderToday()` replaces `#todayList`, so the inserted outlook card is overwritten. The source fix is to render Today first and insert Outlook afterward; this remains pending until the next safe direct `index.html` source edit.
- Local handoff continues through the current parent starter `START_HERE.md`; existing application contracts and deployment architecture remain protected.

## Verification

- `scripts/check-client-contract.mjs` syntax-checks inline/client JavaScript, protects CSS, DOM, LocalStorage and `/api` contracts, requires active runtime imports/delegation, and requires the three log utility buttons to remain connected through `log-tools-ui.js` to `getAnalysis`, full-bootstrap trash data and `restore`.
- `scripts/test-log-tools-ui.mjs` verifies analysis, usage and deleted-record rendering contracts, including the restore control identifier.
- `scripts/test-startup-loader.mjs` verifies supported first startup, background full refresh, later full bootstrap calls, Logs full-data startup, and background forecast handoff.
- `scripts/test-weather-runtime.mjs` verifies background full-bootstrap `weather / forecasts / forecastHourly` are applied to current application state rather than a stale startup snapshot.
- `scripts/test-worker-contract.mjs` verifies startup-loader delivery and Worker transport contracts.
- `scripts/test-log-contract.mjs` / `scripts/test-log-runtime.mjs` cover log range/timing/search/filter/sort/pagination behavior.
- `scripts/test-quick-input-utils.mjs` / `scripts/test-quick-input-runtime.mjs` cover quick-input behavior.
- `scripts/test-rotation-utils.mjs` / `scripts/test-rotation-runtime.mjs` cover rotation selection/history/next-cycle behavior.
- `scripts/test-plan-bulk-utils.mjs` covers bulk request construction and date validation.
- `scripts/test-api-contract.mjs` / `scripts/test-worker-contract.mjs` protect browser-to-GAS normalization and fail-closed postpone behavior.
- Focused startup / log / quick-input / rotation / plan-bulk / API-contract checks remain in normal `npm test`. GitHub Actions are not required.

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
- startup snapshots are same-day only and are not used as complete Logs data;
- startup acceleration applies only to the initial bootstrap in a page session; manual Sync remains a full refresh;
- background full bootstrap must refresh `weather`, `forecasts`, and `forecastHourly` before the normal application bootstrap render runs;
- deleted-record UI must use full bootstrap data rather than the partial startup snapshot;
- log analysis/usage UI must consume the existing `getAnalysis` response rather than recompute a conflicting analysis in the browser;
- active stylesheet boundary remains `styles.css`;
- Cloudflare Pages deployment remains from `main`.

## Current maintenance decision

- Startup performance: two-stage startup active; Logs/manual Sync kept full-data; background weather/forecast refresh parity restored.
- CSS responsibility extraction: complete and active.
- Log runtime delegation: complete and active.
- Log utility buttons: wired and active through `log-tools-ui.js` against existing GAS contracts.
- Quick-input runtime delegation: complete and active.
- Rotation runtime delegation: complete and active.
- Bulk-plan request delegation: complete and active.
- Today outlook render order: concrete source defect identified; direct `index.html` fix remains pending rather than hidden in Worker/runtime injection.
- The client page marker remains `20260819-02` because persisted `index.html` itself was not rewritten in this pass; the next safe source edit of `index.html` must roll it forward to reflect accumulated external-runtime changes.
- Worker build remains `2026-08-19-v31`.
