# Project Status

Updated: 2026-08-08
Client build marker: `20260808-01`
Worker build marker: `2026-08-08-v21`

## Current state

- Cloudflare Pages deployment with no framework build step.
- `main` is the production branch and deploys automatically.
- `_worker.js` remains the same-origin `/api` transport boundary to the existing GAS backend.
- Weather decision helpers are now separated from `index.html`.
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

## Verification result

Executed before the runtime switch:

- unified `npm test`: passed;
- handoff contract: passed;
- Worker contract: all seven checks passed;
- client syntax/API/LocalStorage/DOM contract checks: passed;
- weather utility contract: passed;
- semantic parity with the previous inline implementation: passed;
- weather runtime adapter contract: passed;
- extraction dry-run: passed;
- staged extraction parity check: passed.

Executed immediately after the runtime switch:

- unified `npm test`: passed;
- Worker contract: all seven checks passed;
- client syntax/API/LocalStorage/DOM contract checks: passed;
- dynamic loading of `client/weather-runtime.js`: confirmed;
- import path from `weather-runtime.js` to `weather-utils.js`: confirmed;
- weather utility contract: passed;
- semantic parity for weather display naming, rain judgment, strong-wind judgment, work-risk judgment, plan weather kind, and `safeWindows()`: passed;
- weather runtime adapter contract: passed;
- switched extraction parity check: passed;
- transformed client JavaScript syntax and initialization ordering: passed.

During the required pre/post execution, existing maintenance tests exposed three test-harness issues: ES modules were being parsed as classic scripts, truthy return semantics were asserted as strict booleans, and time-dependent tests inherited the runner's UTC timezone. These were corrected without changing the application weather behavior. The exact-match transform was also aligned to the confirmed current inline source before application.

## Remaining verification

Automated regression checks and the actual source switch are complete. A live browser session was not executed by the repository test runner, so visual rendering against the deployed site remains outside the automated result recorded here.

## Current scope decision

- Weather extraction: complete.
- Client build: `20260808-01`.
- Old inline weather-helper duplication: removed.
- Major Change Planning: not applicable.
- Recommended action for this batch: finish.
