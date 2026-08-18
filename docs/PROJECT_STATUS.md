# Project Status

Updated: 2026-08-18
Client build marker: `20260818-01`
Worker build marker: `2026-08-09-v23`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Application presentation CSS has been extracted from `index.html` into active `styles.css` and is loaded directly by the page.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the source of truth for client log/search/quick-input/rotation JavaScript behavior that has not been safely extracted into active modules.
- Local handoff points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- The stylesheet extraction changes only the client build marker, removes the former inline `<style>` block, and adds the `./styles.css` link; the compare against the immediately preceding source commit shows no JavaScript or DOM behavior change in `index.html`.
- `scripts/check-client-contract.mjs` now requires the external stylesheet link, rejects recreation of the application stylesheet as an inline `<style>` block, and checks representative selectors in `styles.css`.
- Existing repository checks remain available through `npm test` and its focused subcommands.
- Repository-wide `npm test` cannot be executed in the current connector-only environment because a local checkout has no direct GitHub network access. Connector-backed source and commit-diff verification was used for this batch.
- Worker runtime, API behavior, data contract, storage contract, and deployment configuration were not changed.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- active application stylesheet boundary at `styles.css`;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- CSS responsibility extraction: complete and active in the runtime source.
- Client build: `20260818-01`.
- Worker build remains `2026-08-09-v23` because Worker runtime was not changed.
- No unused staged CSS copy remains in `index.html`.
- Further JavaScript responsibility extraction is not bundled into this batch; it should proceed only one active responsibility at a time with runtime wiring and regression verification in the same flow.
