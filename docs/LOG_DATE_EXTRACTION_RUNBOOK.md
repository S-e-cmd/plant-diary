# Log Date Extraction Runbook

This runbook switches the already-staged log/plan date helpers from inline `index.html` implementations to `client/log-date-utils.js` without changing UI, API, storage, renderer, paging, search, or plan mutation behavior.

## Preconditions

1. Work from a clean checkout of the current `main` branch.
2. Confirm the client build marker is `20260809-02`.
3. Run `npm test` before applying the switch.
4. Stop if any existing test fails.

## Apply

```bash
npm run maintenance:apply-log-date-extraction
```

The transform is fail-closed. It requires exactly one match for the build marker, runtime declaration, inline `dateRange`, inline `dayDistance`, inline `planTiming`, and startup initialization. Missing or duplicate source stops the transform instead of guessing.

## Verify

```bash
npm test
```

After the switch, verify that:

- client build marker is `20260809-03`;
- `index.html` loads `client/log-date-utils.js` during startup;
- inline `dateRange`, `dayDistance`, and `planTiming` implementations are removed;
- log page size remains 20;
- day/week/month boundaries are unchanged;
- week boundaries remain Monday through Sunday;
- overdue/today/future labels are unchanged;
- plan timing classification remains `undated / overdue / today / future`;
- sort behavior, search-state shape, renderer, event bindings, API calls, LocalStorage keys, and DOM IDs remain unchanged.

## Rollback

If post-switch verification fails, restore `index.html` to the pre-switch version with build marker `20260809-02`. Do not partially retain the runtime wiring or delete the staged utility/tests while investigating the failure.
