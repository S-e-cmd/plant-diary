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

See `docs/DATA_CONTRACT.md`, `docs/UI_RULES.md`, and `docs/MAJOR_CHANGE_HANDOFF.md` for the detailed boundaries.

## Completed maintenance

### Worker boundary

`_worker.js` was reorganized without changing its public API contract. Route selection, API validation/orchestration, GAS transport, JSON parsing, and response formatting are separated. Worker build marker is `2026-08-08-v21`.

The Worker contract regression test was executed after that refactor and all seven checks passed.

### Regression safety

The repository now contains maintenance checks for:

- Worker transport contract;
- client syntax and important DOM/API/LocalStorage contracts;
- staged weather utility behavior;
- weather runtime compatibility behavior;
- pre-switch weather extraction parity;
- local handoff and Major Change guidance consistency.

`package.json` exposes these through `npm test` and individual `test:*` commands. No external package dependency or build step has been introduced.

### Client weather extraction preparation

The first client responsibility selected for extraction is weather decision logic.

- `client/weather-utils.js` contains the pure weather helper logic.
- `client/weather-runtime.js` provides compatibility with the current call signatures while reading live `weatherRules` and `forecastHourly` state.
- weather utility and runtime contract tests are present.
- `scripts/apply-weather-extraction.mjs` provides a fail-closed exact-match transformation for the eventual `index.html` switch.

The staged files are still **not wired into the deployed `index.html`**. Therefore the client runtime and client build marker remain unchanged.

### Current parent starter alignment

The latest checked parent starter commit is `0a7f13f1fc4acd837df370a29c13d102beebe12e` (`Check app-specific major change handoff during alignment`).

Current parent guidance requires each existing app to retain app-specific protected boundaries and Major Change candidate boundaries while keeping the shared Major Change procedure in the parent starter as the source of truth.

This repository now has:

- `docs/MAJOR_CHANGE_HANDOFF.md`;
- `ai-context.json` reference to that handoff;
- `llms.txt` guidance to re-read the current parent `MAJOR_CHANGE_PLANNING.md` and `PROTOCOL_ROUTING_RULES.md` before future major work;
- `scripts/check-handoff-contract.mjs` to detect drift in that handoff;
- `npm test` wired to run the handoff contract check first.

App-specific Major Change candidate boundaries are context only. They do not by themselves mean `major-change-planning-required` and do not authorize implementation or migration.

## Verification status

Verified:

- current repository structure and handoff files;
- Worker refactor source;
- Worker transport regression test: seven checks passed;
- current parent starter latest commit and new app-specific handoff requirement;
- handoff check is now part of the unified `npm test` command;
- weather extraction source, compatibility adapter, tests, and exact-match switch script exist in the repository.

Not yet verified by execution in the current connected environment:

- full `npm test` after the latest maintenance additions;
- client/weather tests against a local repository checkout;
- actual weather runtime switch in `index.html`;
- browser regression after that future client switch.

The available execution environment cannot currently obtain a GitHub checkout, so unexecuted checks must not be reported as passed.

## Current scope decision

- Maintenance need: medium.
- Scope completion: incomplete.
- Recommended action: continue.
- Major Change Planning: not applicable to the current staged responsibility extraction.

The next runtime-changing step remains the weather helper switch. It should only be committed after the pre-change tests, exact-match transformation, and post-change tests can all run against the same checkout. Until then, additional staged client modules should not be added merely to increase file separation.
