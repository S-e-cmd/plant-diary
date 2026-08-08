# Project Status

Updated: 2026-08-08
Client build marker: `2026-07-19-v29`
Worker build marker: `2026-08-08-v21`

## Current state

- Cloudflare Pages deployment with no framework build step.
- `main` is the production branch and deploys automatically.
- `index.html` still contains the deployed client application and its current client build marker.
- `_worker.js` is the same-origin `/api` transport boundary to the existing GAS backend and delegates non-API requests to static assets.
- The existing App Checker workflow is manual-only and is not the deployment mechanism.
- Local handoff documents are present, including the app-specific Major Change handoff required by the current parent starter.

## Protected contracts

Ordinary maintenance must preserve unless explicitly changed by the current task:

- same-origin `POST /api` browser contract;
- Worker-to-GAS request format and JSON response behavior;
- existing data/storage compatibility, IDs, date formats, and LocalStorage keys;
- current Cloudflare Pages publication route and deployment method;
- major DOM IDs and existing client interaction behavior;
- GAS and spreadsheet internals, which remain outside this repository.

See `docs/DATA_CONTRACT.md`, `docs/UI_RULES.md`, and `docs/MAJOR_CHANGE_HANDOFF.md` for detailed boundaries.

## Completed maintenance

### Worker boundary

`_worker.js` was reorganized without changing its public API contract. Route selection, API validation/orchestration, GAS transport, JSON parsing, and response formatting are separated. Worker build marker is `2026-08-08-v21`.

The Worker contract regression test was executed after that refactor and all seven checks passed.

### Regression safety

The repository now contains maintenance checks for:

- handoff and Major Change guidance consistency;
- Worker transport contract;
- client syntax and important DOM/API/LocalStorage contracts;
- staged weather utility behavior;
- weather runtime compatibility behavior;
- weather extraction dry-run transformation;
- weather extraction parity in both staged and switched states.

`package.json` exposes these through `npm test` and individual `test:*` commands. No external package dependency or build step has been introduced.

### Client weather extraction preparation

The first client responsibility selected for extraction is weather decision logic.

- `client/weather-utils.js` contains pure weather helper logic.
- `client/weather-runtime.js` preserves current call signatures while reading live `weatherRules` and `forecastHourly` state.
- `scripts/weather-extraction-transform.mjs` is now the single source of truth for the fail-closed transformation.
- `scripts/apply-weather-extraction.mjs` only reads `index.html`, calls the shared transform, and writes the verified result.
- `scripts/test-weather-extraction-dry-run.mjs` applies the same transform in memory without touching `index.html`, parses the transformed inline client script with `new Function(...)`, and verifies weather initialization occurs before bootstrap.
- `test-weather-parity.mjs` accepts either a fully staged or fully switched state and rejects mixed/partial states.

Earlier review caught and corrected a proposed top-level `await import(...)` syntax error before runtime activation. The current transform uses async `initializeWeatherRuntime()` plus guarded `startApp()` instead.

The staged files are still **not wired into deployed `index.html`**. Therefore client runtime and client build marker remain unchanged.

### Current parent starter alignment

The latest checked parent starter commit remains `0a7f13f1fc4acd837df370a29c13d102beebe12e` (`Check app-specific major change handoff during alignment`).

This repository retains app-specific protected boundaries and candidate Major Change boundaries while keeping the shared Major Change procedure in the parent starter as source of truth. Candidate boundaries do not by themselves mean `major-change-planning-required` and do not authorize implementation or migration.

## Verification status

Verified:

- current repository structure and handoff files;
- Worker refactor source;
- Worker transport regression test: seven checks passed;
- current parent starter latest commit and app-specific handoff requirement;
- handoff check is part of unified `npm test`;
- weather extraction transform, compatibility adapter, dry-run test, parity test, and application script exist and share one transformation implementation.

Not yet verified by execution in the current connected environment:

- full `npm test` after the latest additions;
- dry-run test against a local repository checkout;
- actual weather runtime switch in `index.html`;
- browser regression after that future client switch.

The available execution environment cannot currently obtain a GitHub checkout, so unexecuted checks must not be reported as passed.

## Current scope decision

- Maintenance need: medium.
- Scope completion: incomplete.
- Recommended action: continue.
- Major Change Planning: not applicable to the current staged responsibility extraction.

The next runtime-changing step remains the weather helper switch. It should only be committed after pre-change `npm test`, the exact-match transformation, and post-change `npm test` can all run against the same checkout. Until then, additional staged client modules should not be added merely to increase file separation.
