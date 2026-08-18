# Project Status

Updated: 2026-08-19
Client build marker: `20260819-01`
Worker build marker: `2026-08-19-v29`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application presentation CSS has been extracted from `index.html` into active `styles.css` and is loaded directly by the page.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Log extraction now has a complete runtime boundary: `client/log-date-utils.js` and `client/log-list-utils.js` own pure processing; `client/log-runtime.js` binds those operations to application state without owning DOM rendering.
- Quick-input extraction now has a complete runtime boundary: `client/quick-input-utils.js` owns pure identity/template/candidate logic; `client/quick-input-runtime.js` binds favorites and recent records to application state without owning LocalStorage or DOM rendering.
- Rotation extraction now has a complete runtime boundary: `client/rotation-utils.js` owns rotation selection/view-model/next-cycle detection; `client/rotation-runtime.js` binds those operations to application state without owning API mutation or GAS business rules.
- Bulk-plan request extraction is contract-backed: `client/plan-bulk-utils.js` contains selected-ID normalization, real `YYYY-MM-DD` validation, and complete/postpone/cancel payload construction.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport points to the optimized deployed GAS Web App URL supplied on 2026-08-19 after the startup-read reduction pass.
- Worker API normalization is active: browser `parse / calendar / calendarBulk / bulkPlans` are converted to GAS `analyze / syncPlanCalendar / syncAllPlansCalendar / batchPlans` with the required payload field aliases.
- `skipRotation` passes through unchanged so GAS retains rotation business-logic ownership.
- Bulk postpone is active in browser runtime: the user is prompted for a target date before mutation; cancelling the prompt performs no request.
- Worker independently validates bulk-postpone dates and returns HTTP 400 before GAS for missing, malformed, or impossible dates.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the active UI runtime for log/search/quick-input/rotation rendering and interactions. The data-processing runtime boundaries are prepared and regression-tested so the next change can be limited to wiring/delegation rather than redesign.
- Local handoff points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- `scripts/check-client-contract.mjs` requires the external stylesheet link, rejects recreation of the application stylesheet as an inline `<style>` block, checks representative selectors, guards the complete `&quot;` HTML-escaping entity, and fixes the bulk-postpone prompt/date-payload runtime contract.
- `scripts/test-log-contract.mjs` covers daily/weekly/monthly boundaries, overdue/today/future classification, text and field filtering, special spray/liquid filters, period filtering, ascending/descending ordering, and 20-item pagination behavior.
- `scripts/test-log-runtime.mjs` verifies state-bound date/timing access and the combined search/period/sort/pagination log list result.
- `scripts/test-quick-input-utils.mjs` covers field identity order, template defaults, favorite matching, duplicate suppression, newest-first ordering, and result limits.
- `scripts/test-quick-input-runtime.mjs` verifies state-bound favorites/recent groups and favorite add/remove behavior.
- `scripts/test-rotation-utils.mjs` covers rotation-plan detection, completed/cancelled exclusion, execution-history ordering, current/next/after selection, minimum 12-frame display behavior, and cyclic-next-cycle detection when no active frame remains.
- `scripts/test-rotation-runtime.mjs` verifies state-bound current/next/after model, history count, and next-cycle requirement.
- `scripts/test-plan-bulk-utils.mjs` covers selected-ID normalization, valid and invalid calendar dates, complete/cancel payloads, postpone payloads, empty selection, and unsupported operations.
- `scripts/test-api-contract.mjs` fixes browser-to-GAS normalization, confirms `skipRotation` passthrough, and rejects missing/malformed/impossible bulk-postpone dates.
- `scripts/test-worker-contract.mjs` confirms invalid bulk-postpone dates return HTTP 400 before any upstream GAS fetch.
- Focused log / quick-input / rotation / plan-bulk / API-contract tests are included in the normal `npm test` sequence.
- The full `index.html` runtime edit for bulk postpone was verified by commit comparison. An incidental one-character HTML-escape regression introduced during whole-file replacement was detected immediately, restored, and the final comparison from the pre-edit baseline shows only the intended build-marker and `bulkSelected()` changes.
- Existing repository checks remain available through `npm test` and its focused subcommands. GitHub Actions are not required for this maintenance flow.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- log search-state shape and 20-item page size;
- quick-input identity field order and favorite/recent selection semantics;
- cyclic rotation history must remain append-only across cycles; completed prior-cycle rows must not be reset to pending;
- GAS owns spreadsheet mutation and rotation business logic; Worker may normalize transport names and validate required transport fields but must not emulate spreadsheet behavior;
- bulk postpone requires a caller-supplied real `YYYY-MM-DD` date; no layer may invent a date;
- runtime boundary modules may consume application state but must not own unrelated UI rendering, LocalStorage, or GAS spreadsheet mutation;
- active application stylesheet boundary at `styles.css`;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- CSS responsibility extraction: complete and active in runtime source.
- Log runtime boundary: implemented and regression-tested; `index.html` delegation remains pending.
- Quick-input runtime boundary: implemented and regression-tested; `index.html` delegation remains pending.
- Rotation runtime boundary: implemented and regression-tested; `index.html` delegation remains pending.
- Bulk-plan request pure-processing boundary: implemented and regression-tested; browser UI currently implements the same request contract inline.
- Bulk postpone runtime flow: complete. Browser collects the date, Worker validates it, and valid requests normalize to GAS `batchPlans(kind='postpone')`.
- A cyclic rotation is explicitly contract-tested to require a next cycle after all cyclic frames become completed/cancelled; GAS is responsible for actually creating the next-cycle rows.
- Browser/GAS action-name drift for `parse / calendar / calendarBulk / bulkPlans` is resolved at the Worker boundary and documented in `docs/API_CONTRACT.md`.
- `skipRotation` is not equivalent to ordinary cancellation and passes through unchanged to GAS.
- Startup performance is now being addressed first: the current optimized GAS deployment reduces repeated Spreadsheet opens and duplicate full-sheet reads without changing the browser bootstrap response contract.
- Client build remains `20260819-01` because the new log/quick/rotation runtime boundaries are not yet wired into `index.html`.
- Worker build is `2026-08-19-v29` for the optimized GAS deployment.
