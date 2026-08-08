# Project Status

Updated: 2026-08-08
Client build marker: `20260808-01`
Worker build marker: `2026-08-08-v22`

## Current state

- Cloudflare Pages deployment with no framework build step.
- `main` is the production branch and deploys automatically.
- `_worker.js` remains the same-origin `/api` boundary and now delegates upstream GAS transport/parsing to `worker/gas-transport.js` on the maintenance branch.
- Weather decision helpers are separated from `index.html`.
- `index.html` dynamically loads `client/weather-runtime.js`, which delegates weather calculations to `client/weather-utils.js`.
- The previous inline implementations of weather naming, rain/wind risk, work risk, plan weather kind, and `safeWindows()` have been removed from `index.html`.

## Weather extraction result

The weather helper switch was executed on one checkout using the prepared exact-match migration.

Startup order after the switch is:

1. `startApp()` enables the initialization overlay.
2. `initializeWeatherRuntime()` loads `client/weather-runtime.js`.
3. The runtime adapter binds the existing helper names to `client/weather-utils.js` while reading live `state.weatherRules` and `state.forecastHourly`.
4. Saved last-tab state is restored.
5. Saved input draft state is restored.
6. `bootstrap()` runs.

The existing API payloads, LocalStorage keys, DOM IDs, record formats, weather thresholds, and Worker/GAS contract were not changed by this extraction.

## GAS transport extraction result

The Worker-side GAS transport responsibility has been separated on `agent/split-gas-transport` without changing the public `/api` contract.

- `_worker.js` retains route selection, method/body validation, response status selection, JSON response formatting, and static asset delegation.
- `worker/gas-transport.js` owns the existing GAS endpoint request, `POST` transport, `text/plain;charset=utf-8`, redirect-follow behavior, upstream response text parsing, and invalid-JSON classification.
- Existing GAS endpoint, request body forwarding, response payload shape, HTTP status behavior, error messages, and cache headers are preserved.
- Worker build marker for this candidate change is `2026-08-08-v22`.
- No GAS code, spreadsheet schema, Binding, Secret, deployment setting, or production data was changed.

## Verification result

Existing weather/client verification remains recorded from the completed weather extraction.

For the GAS transport extraction:

- the modified Worker, extracted transport module, and revised Worker contract test were reproduced locally as ES modules;
- all seven existing Worker contract scenarios passed after extraction;
- non-API static delegation passed;
- `OPTIONS /api` 204 behavior passed;
- non-POST 405 behavior passed;
- empty POST 400 behavior passed;
- valid GAS JSON pass-through and upstream POST/content-type/body contract passed;
- invalid GAS JSON existing 502 contract passed;
- upstream fetch failure existing 502 contract passed.

The repository test now imports `_worker.js` as a real file module so its relative `worker/gas-transport.js` import is exercised rather than evaluating `_worker.js` in isolation through a data URL.

## Remaining verification

- The branch has not been merged into `main`, so production remains unchanged.
- Production deployment/runtime verification is intentionally not claimed before merge.
- No live GAS request was sent as part of this maintenance verification; the existing contract tests use controlled fetch stubs.

## Current scope decision

- GAS transport responsibility extraction: complete on maintenance branch.
- Existing `/api` contract: preserved by automated contract scenarios.
- Client build: `20260808-01` unchanged.
- Candidate Worker build: `2026-08-08-v22`.
- Major Change Planning: not applicable.
- Recommended action for this batch: review/merge the isolated branch before selecting another responsibility.
