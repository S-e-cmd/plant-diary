# Project Status

Updated: 2026-08-18
Client build marker: `20260818-01`
Worker build marker: `2026-08-09-v23`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application presentation CSS has been extracted from `index.html` into active `styles.css` and is loaded directly by the page.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Log extraction is now contract-backed: `client/log-date-utils.js` contains date-range / deadline timing behavior and `client/log-list-utils.js` contains search / period-filter / sort / pagination behavior equivalent to the current inline implementation.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the runtime source of truth for client log/search/quick-input/rotation JavaScript behavior until the log utilities are wired into the page and the equivalent inline functions are removed.
- Local handoff points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- The stylesheet extraction changes only the client build marker, removes the former inline `<style>` block, and adds the `./styles.css` link; the compare against the immediately preceding source commit shows no JavaScript or DOM behavior change in `index.html`.
- `scripts/check-client-contract.mjs` requires the external stylesheet link, rejects recreation of the application stylesheet as an inline `<style>` block, and checks representative selectors in `styles.css`.
- `scripts/test-log-contract.mjs` now imports and executes the log utilities, covering daily/weekly/monthly boundaries, overdue/today/future classification, text and field filtering, special spray/liquid filters, period filtering, ascending/descending ordering, and 20-item pagination behavior.
- The previously referenced but missing `client/log-date-utils.js` file has been restored, so the focused log test no longer has a missing-module failure before assertions run.
- Existing repository checks remain available through `npm test` and its focused subcommands.
- Repository-wide `npm test` cannot be executed in the current connector-only environment because a local checkout has no direct GitHub network access. Exact utility source was syntax/behavior checked separately while connector-backed source verification was used for repository state.
- Worker runtime, API behavior, data contract, storage contract, and deployment configuration were not changed.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- log search-state shape and 20-item page size;
- active application stylesheet boundary at `styles.css`;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- CSS responsibility extraction: complete and active in runtime source.
- Log pure-processing boundary: implemented and regression-tested; runtime wiring remains the next direct change.
- Client build remains `20260818-01` because this batch has not yet changed page runtime behavior.
- Worker build remains `2026-08-09-v23` because Worker runtime was not changed.
- Next runtime step is to wire `log-date-utils.js` and `log-list-utils.js` into `index.html`, then remove the equivalent inline date/search/sort/pagination implementations in the same batch.
