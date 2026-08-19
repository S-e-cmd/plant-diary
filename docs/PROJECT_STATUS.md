# Project Status

Updated: 2026-08-19
Client page marker: `20260819-03`
Worker build marker: `2026-08-19-v42`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application CSS is active in `styles.css`; `index.html` does not recreate the application stylesheet inline.
- Startup acceleration is active in the delivered HTML path. `_worker.js` reads `client/startup-loader.js` from static assets and inlines it before the existing application script, removing an extra browser request.
- Startup acceleration applies only to the first bootstrap request in a page session. Today / Input / Plans may use a same-day snapshot or `bootstrapCore` for first display, then refresh full data in the background.
- The initial accelerated response no longer waits for the browser's Open-Meteo fallback. `startup-loader.js` supplies a one-record `startup-core` forecast marker whenever Core/snapshot data has no forecast rows, allowing the existing page bootstrap to render immediately. Full bootstrap replaces that marker with actual `weather`, `forecasts`, and `forecastHourly` data in the background.
- Background full bootstrap is deferred to the next browser task after the initial Core/snapshot response is returned, so the full refresh cannot begin before the initial response is handed back to the page.
- Logs bypasses partial startup data and performs a full bootstrap immediately. Later manual Sync requests also perform full bootstrap.
- `startup-loader.js` is the only startup fetch wrapper. The superseded duplicate startup path remains removed.
- Background full-bootstrap refresh hands `weather`, `forecasts`, and `forecastHourly` through the active weather runtime before `applyBootstrap`, preventing snapshot/Core forecast state from remaining stale after the full data arrives.
- The current GAS deployment supports `bootstrapCore` and full `bootstrap`; Worker transport points to the two-stage GAS deployment supplied on 2026-08-19.
- Browser external UI modules use `client/api-client.js` for same-origin `/api` POST, JSON parsing and API error conversion instead of duplicating request code.
- Weather decision helpers and browser-download mechanics remain active external client modules.
- Log processing is active runtime code: `log-date-utils.js` / `log-list-utils.js` own pure operations and `log-runtime.js` owns state-bound range, timing, filtering, sorting and pagination.
- Log utility UI is active through `log-tools-ui.js`, installed by the already-active `log-runtime` initialization. `履歴分析` uses GAS `getAnalysis`; `資材・薬剤の使用履歴` renders the `usage` portion of that analysis; `削除済みの記録` explicitly requests a full `bootstrap` before rendering `trash`; each restore action uses GAS `restore` and applies the returned refreshed bootstrap.
- Quick-input processing is active runtime code through `quick-input-utils.js` / `quick-input-runtime.js`.
- Rotation processing is active runtime code through `rotation-utils.js` / `rotation-runtime.js`.
- Bulk-plan request construction is active runtime code through `plan-bulk-utils.js`.
- Client and Worker share one real-calendar `YYYY-MM-DD` validator in `shared/iso-date.js`. Single-plan and bulk postpone reject malformed or impossible dates before GAS mutation.
- Worker rejects missing or whitespace-only record IDs before GAS mutation for record-scoped operations and rejects invalid record types for `update`, `delete`, and `restore`.
- Worker requires `update.patch` to be a non-empty object.
- `save` and `checkDuplicates` require a non-empty entry array; each entry must be a non-empty object with `type` exactly `actual` or `plan` and a non-empty action.
- `completePlan` requires a non-empty entry object in addition to its target ID.
- `parse` / `analyze` require non-empty work text and an explicit `actual` / `plan` input type; the Worker no longer silently defaults malformed analyze calls to `actual`.
- `saveAppSettings` requires a settings object; an empty object remains a valid no-op settings update.
- Worker restricts bulk-plan operations to exactly `complete`, `postpone`, or `cancel`; both browser alias `bulkPlans` and direct GAS action `batchPlans` pass through the same ID, operation, and date validation.
- Bulk target IDs must be an array, are string-trimmed, blank entries are removed, duplicates are removed while preserving order, and at least one valid ID must remain.
- Worker maintains an explicit supported-action boundary. Unknown or missing actions fail before GAS, and malformed JSON is rejected with HTTP 400 at the Worker HTTP boundary rather than forwarded upstream.
- `calendarBulk` is intentionally an all-eligible-plans operation. Browser-provided IDs are only a local zero-target check; Worker normalizes to `syncAllPlansCalendar`, and GAS independently selects eligible rows.
- GAS `syncAllPlansCalendar_()` returns `{ registered, skipped, bootstrap }`; Worker flattens this to bootstrap-shaped browser data while preserving counts under `calendarBulkResult`. Malformed successful wrappers fail closed with HTTP 502.
- GAS `batchPlans` returns `{ processed, skipped, bootstrap }`; Worker likewise flattens this to bootstrap-shaped browser data while preserving counts under `batchPlansResult`. Malformed successful wrappers fail closed with HTTP 502.
- Worker/GAS transport responsibilities remain split. Browser aliases normalize to GAS action names at the Worker boundary while GAS retains spreadsheet mutation ownership.
- `skipRotation` remains distinct from ordinary cancellation and passes through after ID validation so GAS retains rotation mutation ownership.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504. Invalid GAS JSON and ordinary transport failures remain HTTP 502.
- Today rendering now uses `renderTodayTab()`, which always renders the base Today content first and inserts Outlook afterward. Initial Today display, favorite changes, rotation expansion, section collapse/expand, and Outlook day-range changes all use that full redraw path, so the `先の予定` card is no longer erased by `renderToday()`.
- Local handoff continues through the current parent starter `START_HERE.md`; existing application contracts and deployment architecture remain protected.

## Verification

- `scripts/check-client-contract.mjs` syntax-checks inline/client JavaScript, protects CSS, DOM, LocalStorage and `/api` contracts, requires active runtime imports/delegation, protects the log utility buttons, and now protects the Today render contract: base Today content must render before Outlook and all full Today redraw paths must use `renderTodayTab()`.
- `scripts/test-api-client.mjs` covers browser same-origin API success, API error and non-JSON response behavior.
- `scripts/test-api-contract.mjs` covers record ID/type validation, update patches, save/checkDuplicate entries, complete-plan entries, analyze inputs, settings objects, postpone dates, and bulk operation/target normalization.
- `scripts/test-api-final-boundary.mjs` verifies supported-action enforcement and direct `batchPlans` validation parity.
- `scripts/test-worker-json-boundary.mjs` verifies malformed JSON fails at the Worker boundary without an upstream GAS request.
- `scripts/test-iso-date.mjs` covers valid dates, leap day, impossible month-end dates, invalid month values and strict zero-padded format.
- `scripts/check-shared-contract.mjs` requires client bulk-plan validation and Worker API validation to import `shared/iso-date.js` and rejects reintroduction of local date validation.
- `scripts/test-log-tools-ui.mjs` verifies analysis, usage and deleted-record rendering contracts, including the restore control identifier.
- `scripts/test-startup-loader.mjs` verifies supported first startup, `startup-core` forecast markers for Core and legacy empty-forecast snapshots, deferred background full refresh, later full bootstrap calls, Logs full-data startup, and background forecast handoff.
- `scripts/test-weather-runtime.mjs` verifies background full-bootstrap `weather / forecasts / forecastHourly` are applied to current application state rather than a stale startup snapshot.
- `scripts/test-worker-contract.mjs` verifies startup-loader delivery, Worker transport contracts, and wrapped bootstrap normalization for bulk calendar and bulk plan mutations.
- `scripts/test-log-contract.mjs` / `scripts/test-log-runtime.mjs` cover log range/timing/search/filter/sort/pagination behavior.
- `scripts/test-quick-input-utils.mjs` / `scripts/test-quick-input-runtime.mjs` cover quick-input behavior.
- `scripts/test-rotation-utils.mjs` / `scripts/test-rotation-runtime.mjs` cover rotation selection/history/next-cycle behavior.
- `scripts/test-plan-bulk-utils.mjs` covers bulk request construction and date validation through the shared date contract.
- Focused startup / log / quick-input / rotation / plan-bulk / API / Worker checks remain in normal `npm test`. GitHub Actions are not required.

## Protected contracts

- same-origin `/api` request/response shape;
- explicit supported Worker API actions; malformed JSON and unknown actions do not reach GAS;
- GAS backend role and spreadsheet mutation ownership;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- log search-state shape and 20-item page size;
- quick-input identity field order and favorite/recent semantics;
- cyclic rotation history remains append-only across cycles;
- `skipRotation` is not equivalent to ordinary cancellation;
- single and bulk postpone require caller-supplied real `YYYY-MM-DD` dates; Worker uses the shared validator and no layer invents a date;
- record-scoped mutations require a non-empty target ID and fail before GAS when the ID is absent or whitespace-only;
- `update`, `delete`, and `restore` require `type` exactly `actual` or `plan`;
- `update` requires a non-empty object patch;
- save/checkDuplicate entry arrays and complete-plan entry payloads fail closed when structurally invalid;
- analyze calls require explicit valid input type and non-empty text;
- bulk plan operations are restricted to `complete`, `postpone`, or `cancel`, including direct `batchPlans` calls;
- bulk plan IDs are trim/deduplicated at the Worker boundary and must retain at least one target;
- `calendarBulk` means all currently eligible plans, not selected-plan calendar registration; browser-sent IDs are not the mutation authority;
- successful `calendarBulk` and `batchPlans` browser data must be bootstrap-shaped even though GAS returns metadata wrappers; Worker owns those response adaptations;
- startup snapshots are same-day only and are not used as complete Logs data;
- startup acceleration applies only to the initial bootstrap in a page session; manual Sync remains a full refresh;
- accelerated Core/snapshot startup may use only a temporary `startup-core` forecast marker to avoid blocking first paint; full bootstrap remains the authoritative forecast source;
- background full bootstrap must refresh `weather`, `forecasts`, and `forecastHourly` before the normal application bootstrap render runs;
- deleted-record UI must use full bootstrap data rather than the partial startup snapshot;
- log analysis/usage UI must consume the existing `getAnalysis` response rather than recompute a conflicting analysis in the browser;
- Today full redraw order is `renderToday()` then `renderOutlook()` through `renderTodayTab()`; Outlook must not be inserted before `renderToday()` clears `#todayList`;
- active stylesheet boundary remains `styles.css`;
- Cloudflare Pages deployment remains from `main`.

## Current maintenance decision

- Startup performance: two-stage startup active; initial render no longer waits for Open-Meteo fallback; background full refresh begins only after the initial response has been returned; Logs/manual Sync remain full-data.
- Browser API request duplication: external UI modules use `client/api-client.js` as the shared request boundary.
- API boundary hardening: complete for the currently supported action set. Worker now validates mutation targets/payload structure, analyze/settings inputs, shared date rules, direct bulk calls, malformed JSON, and unsupported actions before GAS.
- Bulk response adaptation: complete for `calendarBulk` and `batchPlans`; browser state receives bootstrap-shaped data.
- CSS responsibility extraction: complete and active.
- Log runtime delegation: complete and active.
- Log utility buttons: wired and active through `log-tools-ui.js` against existing GAS contracts.
- Quick-input runtime delegation: complete and active.
- Rotation runtime delegation: complete and active.
- Bulk-plan request delegation: complete and active.
- Today outlook render order: fixed in persisted `index.html` through `renderTodayTab()` and protected by the normal client contract test.
- Client page marker is `20260819-03`.
- Worker build is `2026-08-19-v42`.
