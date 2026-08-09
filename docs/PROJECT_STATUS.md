# Project Status

Updated: 2026-08-09
Client build marker: `20260809-02`
Worker build marker: `2026-08-09-v23`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport now has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- Previously added but unused staged client modules for log dates, log filtering, quick input, and rotation have been removed together with their migration-only tests/scripts/runbook.
- `index.html` remains the actual source of truth for those client behaviors until a future extraction can be wired and verified in the same flow.

## Verification

- Worker timeout behavior was reproduced in an isolated Node ESM test environment.
- Confirmed scenarios: static asset delegation, OPTIONS handling, normal GAS response with timeout signal, explicit timeout -> 504, ordinary network failure -> 502.
- Repository `scripts/test-worker-contract.mjs` now covers the timeout path.
- Unified `npm test` no longer references removed staged modules.
- A complete repository-wide `npm test` is still not executable from the current connector-only environment because a local checkout cannot access GitHub.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- Unused internal-only staging cleanup: complete.
- Worker timeout stability change: complete and reflected in active runtime code.
- Client build: unchanged at `20260809-02` because client runtime was not changed.
- Worker build: `2026-08-09-v23`.
- Remaining maintainability concern: `index.html` is still large, but future extraction should only be performed when runtime wiring and verification can be completed together rather than staged separately.
