# Project Status

Updated: 2026-08-19
Client build marker: `20260818-01`
Worker build marker: `2026-08-19-v24`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application presentation CSS has been extracted from `index.html` into active `styles.css` and is loaded directly by the page.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Log extraction is contract-backed: `client/log-date-utils.js` contains date-range / deadline timing behavior and `client/log-list-utils.js` contains search / period-filter / sort / pagination behavior equivalent to the current inline implementation.
- Quick-input extraction is also contract-backed: `client/quick-input-utils.js` contains quick identity, template generation, favorite matching, and recent-candidate de-duplication/order behavior equivalent to the current inline implementation.
- Rotation extraction is contract-backed: `client/rotation-utils.js` contains rotation-plan detection, active-frame selection, execution-history ordering, current/next/after view-model selection, and cyclic-next-cycle detection.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport now points to the current deployed GAS Web App URL supplied on 2026-08-19.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the runtime source of truth for log/search/quick-input/rotation JavaScript behavior until each extracted boundary is wired into the page and the equivalent inline implementation is removed.
- Local handoff points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- `scripts/check-client-contract.mjs` requires the external stylesheet link, rejects recreation of the application stylesheet as an inline `<style>` block, and checks representative selectors in `styles.css`.
- `scripts/test-log-contract.mjs` imports and executes the log utilities, covering daily/weekly/monthly boundaries, overdue/today/future classification, text and field filtering, special spray/liquid filters, period filtering, ascending/descending ordering, and 20-item pagination behavior.
- `scripts/test-quick-input-utils.mjs` imports and executes the quick-input utility, covering field identity order, template defaults, favorite matching, duplicate suppression, newest-first ordering, and result limits.
- `scripts/test-rotation-utils.mjs` imports and executes the rotation utility, covering rotation-plan detection, completed/cancelled exclusion, execution-history ordering, current/next/after selection, minimum 12-frame display behavior, and cyclic-next-cycle detection when no active frame remains.
- Focused log / quick-input / rotation tests are included in the normal `npm test` sequence.
- Existing repository checks remain available through `npm test` and its focused subcommands.
- Repository-wide `npm test` cannot be executed in the current connector-only environment because a local checkout has no direct GitHub network access. Connector-backed source and commit-diff verification is used for repository state instead of GitHub Actions.
- Client runtime, data/storage formats, and public UI behavior were not changed by the rotation utility extraction.
- Worker runtime changed only to use the current GAS Web App endpoint; its build marker was advanced to `2026-08-19-v24`.

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
- active application stylesheet boundary at `styles.css`;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- CSS responsibility extraction: complete and active in runtime source.
- Log pure-processing boundary: implemented and regression-tested; runtime wiring remains pending.
- Quick-input pure-processing boundary: implemented and regression-tested; runtime wiring remains pending.
- Rotation pure-processing boundary: implemented and regression-tested; runtime wiring remains pending.
- A cyclic rotation is now explicitly contract-tested to require a next cycle after all cyclic frames become completed/cancelled; GAS remains responsible for actually creating the next-cycle rows.
- The uploaded GAS source and current browser code expose action-name differences (`parse`/`calendar`/`skipRotation` versus GAS canonical handlers). Do not guess-map these calls. Verify the actually deployed request contract before changing runtime routing or payloads.
- Current GitHub connector mutation supports whole-file replacement for `index.html`, not a safe partial patch. Do not work around this by introducing hidden runtime injection or coupling unrelated modules merely to force the switch; keep the existing page runtime until a safe exact-file edit path is available.
- Client build remains `20260818-01` because the rotation module is not yet wired into page runtime.
- Worker build is `2026-08-19-v24` after the GAS endpoint update.
