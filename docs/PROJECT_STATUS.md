# Project Status

Updated: 2026-08-18
Client build marker: `20260818-01`
Worker build marker: `2026-08-09-v23`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application presentation CSS has been extracted from `index.html` into active `styles.css` and is loaded directly by the page.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Log extraction is contract-backed: `client/log-date-utils.js` contains date-range / deadline timing behavior and `client/log-list-utils.js` contains search / period-filter / sort / pagination behavior equivalent to the current inline implementation.
- Quick-input extraction is also contract-backed: `client/quick-input-utils.js` contains quick identity, template generation, favorite matching, and recent-candidate de-duplication/order behavior equivalent to the current inline implementation.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the runtime source of truth for log/search/quick-input/rotation JavaScript behavior until each extracted boundary is wired into the page and the equivalent inline implementation is removed.
- Local handoff points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- `scripts/check-client-contract.mjs` requires the external stylesheet link, rejects recreation of the application stylesheet as an inline `<style>` block, and checks representative selectors in `styles.css`.
- `scripts/test-log-contract.mjs` imports and executes the log utilities, covering daily/weekly/monthly boundaries, overdue/today/future classification, text and field filtering, special spray/liquid filters, period filtering, ascending/descending ordering, and 20-item pagination behavior.
- `scripts/test-quick-input-utils.mjs` imports and executes the quick-input utility, covering field identity order, template defaults, favorite matching, duplicate suppression, newest-first ordering, and result limits.
- The focused quick-input test is included in the normal `npm test` sequence as `npm run test:quick`.
- Existing repository checks remain available through `npm test` and its focused subcommands.
- Repository-wide `npm test` cannot be executed in the current connector-only environment because a local checkout has no direct GitHub network access. Connector-backed source and commit-diff verification is used for repository state instead of GitHub Actions.
- Worker runtime, API behavior, data contract, storage contract, and deployment configuration were not changed.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- log search-state shape and 20-item page size;
- quick-input identity field order and favorite/recent selection semantics;
- active application stylesheet boundary at `styles.css`;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- CSS responsibility extraction: complete and active in runtime source.
- Log pure-processing boundary: implemented and regression-tested; runtime wiring remains pending.
- Quick-input pure-processing boundary: implemented and regression-tested; runtime wiring remains pending.
- Current GitHub connector mutation supports whole-file replacement for `index.html`, not a safe partial patch. Do not work around this by introducing hidden runtime injection or coupling unrelated modules merely to force the switch; keep the existing page runtime until a safe exact-file edit path is available.
- Client build remains `20260818-01` because these additions do not change page runtime behavior.
- Worker build remains `2026-08-09-v23` because Worker runtime was not changed.
