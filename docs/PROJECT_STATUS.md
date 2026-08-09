# Project Status

Updated: 2026-08-09
Client build marker: `20260809-01`
Worker build marker: `2026-08-08-v22`

## Current state

- Cloudflare Pages deployment with no framework build step.
- `main` is the production branch and deploys automatically.
- `_worker.js` is the same-origin `/api` boundary and delegates upstream GAS transport/parsing to `worker/gas-transport.js`.
- Weather decision helpers are separated from `index.html` through `client/weather-runtime.js` and `client/weather-utils.js`.
- Browser CSV download creation/revocation is isolated behind `downloadBrowserBlob()` while CSV selection, columns, filename pattern, and formatting remain unchanged.
- AI handoff files are present and reference the parent starter instead of copying shared protocol rules into this repository.

## Completed alignment work

### Weather responsibility extraction

- Weather naming, rain/wind risk, work-risk, plan-weather-kind, and safe-window helpers were moved out of the large inline client script.
- `startApp()` initializes the weather runtime before saved state restoration and `bootstrap()`.
- Existing weather thresholds, LocalStorage keys, DOM IDs, API payloads, and record formats were preserved.

### Worker/GAS transport extraction

- `_worker.js` retains route selection, request validation, status selection, JSON formatting, and static asset delegation.
- `worker/gas-transport.js` owns GAS HTTP transport and upstream JSON parsing.
- Existing `/api` route, POST/content-type/body behavior, response payload shape, cache headers, error messages, and GAS endpoint contract are preserved.

### Browser download helper extraction

- CSV export now calls a small browser Blob download helper instead of constructing/revoking the object URL inside the CSV click handler.
- This is a responsibility cleanup only; exported rows and CSV data contract were not changed.

## Verification recorded in repository

The unified maintenance check is:

```bash
npm test
```

It covers:

- handoff document consistency;
- Worker/API contract scenarios;
- client syntax and protected client contracts;
- weather utility/runtime/parity checks and extraction safeguards.

The Worker contract suite covers static delegation, `OPTIONS /api`, non-POST rejection, empty POST rejection, GAS request forwarding, valid JSON pass-through, invalid upstream JSON, and upstream transport failure.

## Protected contracts

Current maintenance must continue to preserve unless explicitly changed:

- same-origin `/api` and its current request/response behavior;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved client state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV export columns;
- Cloudflare Pages deployment from `main`.

## Remaining maintenance

- `index.html` still contains multiple unrelated client responsibilities and remains the main maintainability risk.
- Further extraction should stay incremental and target cohesive client responsibilities with confirmed dependency boundaries.
- No broad rewrite, storage migration, backend replacement, route change, or template-shaped directory migration is justified by the current alignment work.

## Current scope decision

- Handoff synchronization with current `main`: complete.
- Weather helper extraction: complete.
- Worker/GAS transport extraction: complete and present on `main`.
- Browser download helper extraction: complete.
- Major Change Planning: not applicable to the current maintenance scope.
- Recommended next batch: continue incremental client responsibility extraction from `index.html`, choosing a self-contained area with existing contract coverage before changing behavior.
