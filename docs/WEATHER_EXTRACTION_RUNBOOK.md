# Weather Extraction Runbook

Updated: 2026-08-08

## Purpose

This runbook applies only to the staged extraction of weather decision helpers from `index.html` into `client/weather-utils.js` and `client/weather-runtime.js`.

It is an ordinary Existing App Alignment change, not authorization for a broader architecture, storage, API, routing, authentication, or deployment migration.

## Protected contracts

The switch must not change:

- same-origin `POST /api` behavior;
- Worker-to-GAS request/response behavior;
- LocalStorage keys or saved client state shape;
- DOM IDs or existing UI operations;
- weather rule thresholds or their editable settings behavior;
- plan/actual record formats;
- Cloudflare Pages deployment method or public routing.

## Preconditions

Run all commands against one clean checkout of the same commit.

1. Confirm `index.html` still has client build `2026-07-19-v29`.
2. Confirm `client/weather-utils.js` and `client/weather-runtime.js` exist.
3. Confirm the working tree has no unrelated changes.
4. Run:

```bash
npm test
```

Do not continue if any check fails.

## Dry run

The unified test suite includes `scripts/test-weather-extraction-dry-run.mjs`.

It must verify the shared exact-match transformation in memory without writing `index.html`, including transformed client JavaScript syntax and startup ordering.

Do not bypass a dry-run failure by editing the expected source strings to match an unexplained drift. First determine why `index.html` changed.

## Apply

Only after the pre-change checks pass:

```bash
npm run maintenance:apply-weather-extraction
```

The transformation must fail closed if the expected build marker, weather helper block, or startup block differs from the confirmed source.

Expected resulting client build:

```text
20260808-01
```

## Post-change verification

Immediately after applying, before any other code change:

```bash
npm test
```

Confirm that:

- parity reports the fully switched state, not a mixed state;
- inline weather helpers are gone;
- `client/weather-runtime.js` is dynamically loaded through the guarded startup path;
- `initializeWeatherRuntime()` completes before `bootstrap()`;
- the Worker/API contract checks still pass;
- handoff checks still pass.

Then inspect the diff. The runtime change should be limited to the client build marker, weather-helper bridge, and guarded startup block. Any unrelated `index.html` change is a stop condition.

## Browser verification

After deployment, verify at minimum:

- app opens without a blank screen or JavaScript initialization error;
- saved last tab restoration still works;
- saved draft restoration still works;
- today weather and tomorrow forecast render;
- weather risk messages render;
- weather rule settings can be edited and immediately affect risk calculations;
- work-window calculation renders;
- outlook weather-risk handling renders;
- update/bootstrap completes normally;
- input, logs, and plans tabs remain usable.

Do not begin another responsibility extraction until this verification is complete.

## Rollback

If post-change tests or browser verification fail:

1. Do not patch forward with unrelated fixes.
2. Revert only the weather extraction commit so `index.html` returns to the known staged state with build `2026-07-19-v29`.
3. Keep `client/weather-utils.js`, `client/weather-runtime.js`, transformation scripts, and tests unless they are themselves the confirmed cause; they are inactive while `index.html` is staged.
4. Re-run `npm test` after rollback.
5. Record the confirmed failure cause in `docs/PROJECT_STATUS.md` before attempting a revised switch.

Rollback must preserve API, storage, routing, and data contracts.

## Stop conditions

Stop the switch and reassess if any of the following is observed:

- expected exact-match source is missing or duplicated;
- pre-change or post-change `npm test` fails;
- transformed inline script has a syntax error;
- unrelated `index.html` content changes;
- weather helper behavior differs from the confirmed contract tests;
- startup order allows rendering/bootstrap before weather runtime initialization;
- a required change expands into storage, API, auth, routing, or deployment migration.

If the last condition occurs, re-check the current parent starter Major Change Planning rules and the local `docs/MAJOR_CHANGE_HANDOFF.md` before continuing.
