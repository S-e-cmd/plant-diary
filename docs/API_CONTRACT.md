# Browser / Worker / GAS API contract

Updated: 2026-08-19

The browser talks only to same-origin `POST /api`. `_worker.js` owns compatibility normalization before forwarding JSON to the GAS Web App.

## Browser actions normalized by Worker

| Browser action | GAS action | Payload normalization |
| --- | --- | --- |
| `parse` | `analyze` | `rawText -> text`, `type -> inputType`; preserves `date` |
| `calendar` | `syncPlanCalendar` | preserves `id` |
| `calendarBulk` | `syncAllPlansCalendar` | GAS operates on all eligible unsynced dated plans; browser `ids` are not forwarded |
| `bulkPlans` | `batchPlans` | `operation -> kind`; preserves `ids`; postpone preserves validated `date` |

All other action names are forwarded unchanged. In particular, `skipRotation` must pass through unchanged to GAS.

## Known business-logic actions

`skipRotation` is intentionally **not** translated to `cancelPlan`. Rotation skip has different semantics: the current rotation frame is recorded as cancelled and, when cyclic, a new copy of the same `rotationOrder` is appended as pending so the skipped frame returns after later frames.

The GAS backend owns that behavior.

## Bulk postpone contract

The browser bulk-postpone flow collects `延期後の日付（YYYY-MM-DD）` before sending the request. Cancelling the prompt performs no mutation.

A valid request is `bulkPlans(operation='postpone', ids=[...], date='YYYY-MM-DD')`. Worker converts it to `batchPlans(kind='postpone')` and preserves the supplied date.

Worker independently validates that the target is a real calendar date in exact `YYYY-MM-DD` form. Missing dates, malformed values such as `2026-8-21`, and impossible dates such as `2026-02-29` return HTTP 400 before GAS is called. Worker never invents or normalizes a target date.

## Protected boundary

- Browser keeps same-origin `/api`.
- GAS remains the owner of spreadsheet mutations and rotation business rules.
- Worker may normalize transport-level action/payload names and validate required transport fields, but must not implement spreadsheet business logic.
- Do not silently substitute `skipRotation -> cancelPlan` or invent a bulk-postpone date.
