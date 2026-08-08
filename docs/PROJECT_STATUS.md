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
- Local AI handoff and maintenance documents are now present.

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

Re-evaluated the scope after the explicit request for code maintenance. Code organization is itself a direct-change in this task, so the previous finish-for-now decision was too narrow.

Changed `_worker.js` without changing the external API contract:

- separated route selection from `/api` handling;
- separated GAS transport from GAS JSON parsing;
- retained `POST /api`, `OPTIONS`, non-POST 405 behavior, empty-body 400 behavior, GAS `text/plain;charset=utf-8` forwarding, redirect following, JSON response headers, and static asset delegation;
- retained the existing GAS JSON error and transport error messages;
- updated the Worker build marker from `2026-07-19-v20` to `2026-08-08-v21`.

No GAS endpoint, API payload schema, storage format, UI markup, client state shape, Cloudflare setting, production resource, or GitHub Actions behavior was changed.

## 2026-08-08 maintenance batch 3

Added regression safety checks before touching the responsibility-heavy client file.

- `scripts/test-worker-contract.mjs` verifies static asset delegation, `OPTIONS /api`, method restriction, empty-body handling, GAS forwarding format, valid JSON pass-through, invalid JSON handling, and upstream failure handling.
- The Worker contract test was executed against the current refactored Worker source and all seven checks passed.
- `scripts/check-client-contract.mjs` was added to parse inline client JavaScript and assert important current contracts such as same-origin `/api`, LocalStorage keys, and required DOM IDs.
- README now documents the maintenance files and the Worker regression test command.

The client contract checker is intentionally a guard before client extraction. Its addition does not change runtime behavior. Repository-side execution of that checker remains pending until the current `index.html` is available in an execution environment; it must not be reported as verified until actually run.

## Confirmed client maintenance observations

The client code has been inspected beyond file size alone. Confirmed responsibilities currently co-located in `index.html` include:

- client state and LocalStorage-backed UI preferences/drafts;
- same-origin API client and bootstrap orchestration;
- weather and forecast handling;
- rendering for pinned information, logs, plans, outlook, rotation, and quick input;
- plan/actual record editing and bulk operations;
- UI event wiring.

These are real responsibility boundaries, so incremental extraction is eligible within the explicit code-maintenance scope. Extraction must preserve the existing global/DOM dependencies rather than perform a broad rewrite.

## Verification status

- Current Worker source after refactor: verified from repository state.
- Existing Worker transport contract: verified by executable regression test, seven checks passed.
- Existing `/api` route/method/body/upstream/response contract: verified.
- Client static contract checker: implemented; execution pending, not yet counted as verified.
- Client runtime source: inspected; no client runtime change was made in batch 3.
- Production browser regression after Worker deployment: pending because the connected GitHub tool does not provide the deployed Cloudflare runtime state.
- External GAS/spreadsheet internals: not inspected; unchanged and outside the code-maintenance change.

## Current scope decision

- Maintenance need: medium.
- Scope completion: incomplete.
- Recommended action: continue.
- Reason: code maintenance is explicitly in scope, the Worker boundary now has a regression safety net, and confirmed client responsibilities remain co-located in `index.html`. The next client change should occur only after the client contract checker can be executed against the current source.

## Next maintenance batch

- execute the client contract checker against the current `index.html`;
- if it passes, extract one small cohesive client responsibility with closed dependencies;
- preserve current DOM IDs, state shape, LocalStorage keys, API payloads, and event behavior;
- update the client build marker when a deployed client asset changes;
- re-run client contract and affected-path checks before taking another responsibility.
