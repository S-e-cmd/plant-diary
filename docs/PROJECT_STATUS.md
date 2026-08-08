# Project Status

Updated: 2026-08-08
Client build marker: `2026-07-19-v29`
Worker build marker: `2026-08-08-v21`

## Confirmed current state

- Existing app is a Cloudflare Pages deployment with no framework build step.
- `index.html` contains the client application and its current client build marker.
- `_worker.js` exposes the existing `/api` transport to GAS and delegates other requests to static assets.
- `main` is the production branch and Cloudflare Pages deployment is automatic from repository changes.
- The App Checker GitHub Actions workflow is manual-only and is not used for deployment.
- Local AI handoff and maintenance documents are present.

## 2026-08-08 maintenance batch 1

Added non-runtime handoff files aligned with the existing-app maintenance protocol:

- `ai-context.json`
- `llms.txt`
- `docs/ARCHITECTURE.md`
- `docs/DATA_CONTRACT.md`
- `docs/UI_RULES.md`
- `docs/PROJECT_STATUS.md`

This batch did not change runtime behavior.

## 2026-08-08 maintenance batch 2

Changed `_worker.js` without changing the external API contract:

- separated route selection from `/api` handling;
- separated GAS transport from GAS JSON parsing;
- retained `POST /api`, `OPTIONS`, non-POST 405 behavior, empty-body 400 behavior, GAS forwarding format, redirect following, JSON response headers, and static asset delegation;
- retained the existing GAS JSON error and transport error messages;
- updated the Worker build marker from `2026-07-19-v20` to `2026-08-08-v21`.

No GAS endpoint, API payload schema, storage format, UI markup, client state shape, Cloudflare setting, production resource, or GitHub Actions behavior was changed.

## 2026-08-08 maintenance batch 3

Added regression safety checks before touching the responsibility-heavy client file.

- `scripts/test-worker-contract.mjs` verifies the Worker transport contract.
- The Worker contract test was executed against the refactored Worker source and all seven checks passed.
- `scripts/check-client-contract.mjs` was added for client syntax and important static contracts.
- README documents the maintenance files and regression checks.

## 2026-08-08 maintenance batch 4

Re-read the current parent `app-starter-template`, including the Major Change Planning gate.

Confirmed interpretation for this application:

- file size, file count, or multiple responsibilities alone do not make the current maintenance a Major Change;
- the requested outcome can still be approached through local, staged, contract-preserving changes;
- no storage backend switch, auth switch, breaking API change, migration, deployment target change, or other confirmed transition requirement has been identified in the current scope;
- therefore the work remains Existing App Alignment, not `major-change-planning-required`.

Added `package.json` as a runtime-neutral maintenance entry point. It introduces no package dependency or build step.

## 2026-08-08 maintenance batch 5

Continued preparation for safe client extraction without changing the deployed client runtime.

- strengthened `scripts/check-client-contract.mjs` to protect additional LocalStorage, DOM, weather, API, and bootstrap contracts;
- made the checker extraction-ready: it now parses both inline client JavaScript and future `client/*.js` files;
- future extracted client files must also be referenced by `index.html`, preventing dead or disconnected modules from passing the maintenance check;
- README now documents this extraction-ready behavior.

A local clone/test execution was attempted from the available execution environment, but outbound access to GitHub was unavailable there. This is an execution-environment limitation, not a repository test failure. The strengthened client checker has therefore been committed but must not be reported as executed or verified yet.

No deployed client runtime file was modified in batch 5, so the client build marker remains unchanged.

## Confirmed client maintenance observations

The client code has been inspected beyond file size alone. Confirmed responsibilities currently co-located in `index.html` include:

- client state and LocalStorage-backed UI preferences/drafts;
- same-origin API client and bootstrap orchestration;
- weather and forecast handling;
- rendering for pinned information, logs, plans, outlook, rotation, and quick input;
- plan/actual record editing and bulk operations;
- UI event wiring.

The weather helper group is a suitable first extraction candidate because several functions are cohesive and can be separated without changing storage, API payloads, DOM IDs, or backend contracts. Runtime extraction is intentionally held until the client checker can be executed against the current checkout and then re-run after the change.

## Verification status

- Current Worker source after refactor: verified from repository state.
- Existing Worker transport contract: verified by executable regression test, seven checks passed.
- Existing `/api` route/method/body/upstream/response contract: verified.
- Current parent starter Major Change rules: verified against the current repository state.
- Major Change Planning requirement for current maintenance: not-applicable based on currently confirmed scope and contracts.
- Client static contract checker: implemented and strengthened; execution pending, not yet counted as verified.
- Unified `npm test` entry point: implemented; execution pending because the available execution environment cannot retrieve the repository checkout.
- Client runtime source: inspected; no client runtime change was made in batch 5.
- Production browser regression after Worker deployment: pending because the connected GitHub tool does not provide the deployed Cloudflare runtime state.
- External GAS/spreadsheet internals: not inspected; unchanged and outside the code-maintenance change.

## Current scope decision

- Maintenance need: medium.
- Scope completion: incomplete.
- Recommended action: continue.
- Reason: code maintenance remains explicitly in scope, the current parent rules support staged changes, and the safety checker has now been prepared to follow extracted client modules. Runtime client extraction remains the next implementation step once pre-change execution verification is available.

## Next maintenance batch

- execute `npm test` against the current repository checkout;
- if it passes, extract the weather helper responsibility as the first small client module;
- preserve current DOM IDs, state shape, LocalStorage keys, API payloads, default thresholds, and existing UI behavior;
- update the client build marker because a deployed client asset will change;
- re-run the same checks after extraction before taking another responsibility.
