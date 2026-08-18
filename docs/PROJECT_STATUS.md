# Project Status

Updated: 2026-08-18
Client build marker: `20260809-02`
Worker build marker: `2026-08-09-v23`

## Current state

- Cloudflare Pages deployment with `main` as the production branch.
- Weather decision helpers and browser-download mechanics are active external client modules.
- Worker/GAS transport responsibilities are split and active in production code.
- GAS transport has a 25-second timeout; timeout responses use HTTP 504 with an explicit retry message.
- Invalid GAS JSON and ordinary transport failures remain on the existing HTTP 502 paths.
- `index.html` remains the source of truth for client log/search/quick-input/rotation behavior that has not been safely extracted into active modules.
- Local handoff now points future work through the current parent starter `START_HERE.md` before selecting work mode/protocol, while retaining the app's existing contracts and historical bootstrap provenance.

## Verification

- Existing repository checks remain available through `npm test` and its focused subcommands.
- The handoff contract now verifies the parent `START_HERE.md` entrypoint, the three parent work modes, public-handoff filtering metadata, and the existing Major Change handoff markers.
- Repository-wide `npm test` could not be executed in the current environment because direct GitHub network access for a local checkout is unavailable; connector-backed source inspection was used for this documentation/handoff-only alignment.
- No client runtime, Worker runtime, API behavior, data contract, storage contract, or deployment configuration was changed in this alignment batch.

## Protected contracts

- same-origin `/api` request/response shape;
- GAS backend role and external spreadsheet contract;
- LocalStorage keys and saved-state compatibility;
- existing DOM IDs and primary UI behavior;
- record/date formats and CSV columns/format;
- existing client log/search/quick-input/rotation semantics;
- Cloudflare Pages deployment from `main`.

## Current maintenance decision

- Parent starter drift was treated as handoff drift only; no runtime restructuring was performed merely to match the template.
- `ai-context.json` now distinguishes historical bootstrap starter metadata from current parent entrypoints/rules.
- `llms.txt` now routes future work through current `START_HERE.md` before protocol selection.
- Handoff regression checks were strengthened so these entrypoints and filtering rules cannot silently disappear.
- Client build remains `20260809-02`; Worker build remains `2026-08-09-v23` because runtime behavior did not change.
- Required alignment work for this general maintenance request is complete. Further client extraction/refactoring remains optional until tied to a concrete maintenance or feature need with runtime wiring and verification in the same flow.
