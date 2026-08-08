# Major Change Handoff

This file stores only application-specific Major Change boundaries and protected contracts. Shared planning and authorization rules remain canonical in the current parent `S-e-cmd/app-starter-template`:

- `docs/MAJOR_CHANGE_PLANNING.md`
- `docs/PROTOCOL_ROUTING_RULES.md`

Before any future large architectural or transition change, re-read the current parent rules and evaluate the current evidence. The boundaries below are **candidates only**; listing them does not mean `major-change-planning-required`, and it does not authorize implementation, migration, production mutation, or deletion.

## Protected current contracts

- Browser API route remains same-origin `POST /api`.
- `_worker.js` remains a thin transport boundary between the browser and the existing GAS backend.
- Worker-to-GAS requests remain `POST` with `Content-Type: text/plain;charset=utf-8` and redirects followed.
- Existing response/error behavior documented in `docs/DATA_CONTRACT.md` remains compatible unless explicitly changed.
- GAS source, spreadsheet schema/configuration, API keys, and external backend resources are outside this repository and must not be recreated, migrated, or replaced as part of ordinary repository maintenance.
- Existing LocalStorage keys, record identifiers, date formats, request/response data shapes, and spreadsheet-facing contracts must not be changed by code cleanup alone.
- Cloudflare Pages automatic deployment from `main` remains the publication method unless an explicit environment/deployment change is requested.
- Existing public routes and principal UI behavior must be preserved during maintenance unless the current task explicitly changes them.

## App-specific Major Change candidate boundaries

The following could require Major Change Planning **only if current evidence confirms that the requested outcome cannot be achieved safely through local staged changes**:

- replacing the existing GAS backend or changing the browser-to-GAS transport architecture;
- changing `/api` in a breaking way or changing the request/response contract used by the client and GAS;
- changing the persistent data model, spreadsheet-facing schema, identifiers, or stored date/record compatibility in a way that requires migration;
- moving persistence to a different backend or introducing a transition between old and new storage systems;
- changing the production routing, public URL strategy, or deployment target in a way that requires a controlled transition;
- introducing authentication or access-control architecture where current public/runtime contracts must transition;
- replacing the current client architecture in a way that cannot preserve existing UI/data/API behavior incrementally.

File size, file count, extracting cohesive helpers, splitting `index.html`, or touching both UI and API-related code are not Major Change evidence by themselves.

## Existing transition / rollback references

- Current architecture: `docs/ARCHITECTURE.md`
- Current data/API compatibility rules: `docs/DATA_CONTRACT.md`
- Current UI constraints: `docs/UI_RULES.md`
- Current maintenance progress and staged weather extraction: `docs/PROJECT_STATUS.md`
- Exact-match weather extraction helper: `scripts/apply-weather-extraction.mjs`

No separate production migration or rollback plan is currently confirmed in this repository. Do not invent one from this handoff; create or reference one only when a concrete future change requires it.
