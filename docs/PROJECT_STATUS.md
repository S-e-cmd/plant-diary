# Project Status

Updated: 2026-08-19
Client page marker: `20260819-03`
Worker build marker: `2026-08-19-v45`

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
- Worker GAS transport now points to the deployed seasonal-rotation GAS endpoint supplied on 2026-08-19: deployment id `AKfycbz5pgdvPVOvgpPMhoTFvkWDvZrk4FILj8IAjE58xl8vJdN25m5Ea1pUimqRxArhY3F9LA`.
- Browser external UI modules use `client/api-client.js` for same-origin `/api` POST, JSON parsing and API error conversion instead of duplicating request code.
- Weather decision helpers and browser-download mechanics remain active external client modules.
- Log processing is active runtime code: `log-date-utils.js` / `log-list-utils.js` own pure operations and `log-runtime.js` owns state-bound range, timing, filtering, sorting and pagination.
- Log utility UI is active through `log-tools-ui.js`, installed by the already-active `log-runtime` initialization. `履歴分析` uses GAS `getAnalysis`; `資材・薬剤の使用履歴` renders the `usage` portion of that analysis; `削除済みの記録` explicitly requests a full `bootstrap` before rendering `trash`; each restore action uses GAS `restore` and applies the returned refreshed bootstrap.
- Quick-input processing is active runtime code through `quick-input-utils.js` / `quick-input-runtime.js`.
- Rotation processing is active through `rotation-utils.js` / `rotation-runtime.js`. Seasonal lifecycle support is additionally implemented in `rotation-season-ui.js`.
- Seasonal rotation design is explicit: `今季終了` closes only the remaining active rotation rows for the current season; definitions and historical actual records remain. The next season is not auto-started. Instead, after the stored annual start threshold is reached in a later year, Today shows an `今季を開始` prompt. Starting creates a fresh ordered cycle from retained definitions beginning at rotation order 1.
- The default annual restart prompt threshold is `06-15` for the current dahlia rotation. The threshold is persisted by GAS with the season-ending state rather than LocalStorage, so another device can make the same next-season decision.
- Rotation season metadata is returned on rotation plan objects as `rotationSeasonState`, `rotationSeasonYear`, `rotationStartMonthDay`, and `rotationSeasonCapable`.
- Worker accepts `endRotationSeason` and `startRotationSeason` only with a non-empty `rotationName`. `endRotationSeason.startMonthDay` defaults to `06-15` and must be a real `MM-DD` calendar value.
- Bulk-plan request construction is active runtime code through `plan-bulk-utils.js`.
- Client and Worker share one real-calendar `YYYY-MM-DD` validator in `shared/iso-date.js`. Single-plan and bulk postpone reject malformed or impossible dates before GAS mutation.
- Worker rejects missing or whitespace-only record IDs before GAS mutation for record-scoped operations and rejects invalid record types for `update`, `delete`, and `restore`.
- Worker requires `update.patch` to be a non-empty object.
- `save` and `checkDuplicates` require a non-empty entry array; each entry must be a non-empty object with `type` exactly `actual` or `plan` and a non-empty action.
- `completePlan` requires a non-empty entry object in addition to its target ID.
- `parse` / `analyze` require non-empty work text and an explicit `actual` / `plan` input type.
- `saveAppSettings` requires a settings object; an empty object remains a valid no-op settings update.
- Worker restricts bulk-plan operations to exactly `complete`, `postpone`, or `cancel`; both browser alias `bulkPlans` and direct GAS action `batchPlans` pass through the same validation.
- Worker maintains an explicit supported-action boundary. Unknown or missing actions fail before GAS, and malformed JSON is rejected with HTTP 400 at the Worker HTTP boundary.
- `calendarBulk` is intentionally an all-eligible-plans operation. Browser-provided IDs are only a local zero-target check; Worker normalizes to `syncAllPlansCalendar`, and GAS independently selects eligible rows.
- GAS `syncAllPlansCalendar_()` and `batchPlans` wrapper responses are normalized by Worker to bootstrap-shaped browser data.
- `skipRotation` remains distinct from ordinary cancellation and passes through after ID validation so GAS retains rotation mutation ownership.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504. Invalid GAS JSON and ordinary transport failures remain HTTP 502.
- Today rendering uses `renderTodayTab()`, which always renders the base Today content first and inserts Outlook afterward.

## Verification

- `scripts/check-client-contract.mjs` protects CSS, DOM, LocalStorage, `/api`, runtime delegation and Today render contracts.
- Every file under `client/*.js`, including `rotation-season-ui.js`, is syntax-checked by the normal client contract test.
- API contract tests cover record IDs/types, update patches, entries, analyze inputs, settings, dates, bulk operations and seasonal rotation actions.
- Worker tests cover malformed JSON, startup-loader delivery and wrapped bootstrap normalization.
- Rotation tests cover active behavior, persisted season metadata, same-year suppression, later-year threshold detection, order-1 restart prompting and GAS capability gating.
- Focused startup / log / quick-input / rotation / plan-bulk / API / Worker checks remain in normal `npm test`. GitHub Actions are not required.

## Protected contracts

- same-origin `/api` request/response shape;
- explicit supported Worker API actions; malformed JSON and unknown actions do not reach GAS;
- GAS backend role and spreadsheet mutation ownership;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- cyclic rotation history remains append-only across cycles;
- rotation season ending must not delete the rotation definition or historical actual records;
- next-season restart must be a user-confirmed action, not an automatic mutation;
- next-season restart begins from rotation order 1 using retained definitions;
- a season ended in year N must not reappear as a start prompt during year N; it may reappear only in a later year after its persisted start `MM-DD` threshold;
- `skipRotation` is not equivalent to ordinary cancellation;
- startup snapshots are same-day only and are not used as complete Logs data;
- Today full redraw order is `renderToday()` then `renderOutlook()` through `renderTodayTab()`;
- Cloudflare Pages deployment remains from `main`.

## Current maintenance decision

- Startup performance: two-stage startup active; Logs/manual Sync remain full-data.
- API boundary hardening: complete for the currently supported action set, including rotation-season operations.
- Rotation season lifecycle: client, Worker and GAS deployment are aligned; default next-season prompt date is June 15.
- Today outlook render order: fixed and protected by the normal client contract test.
- Client page marker is `20260819-03`.
- Worker build is `2026-08-19-v45`.
