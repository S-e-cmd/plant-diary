# Browser / Worker / GAS API contract

Updated: 2026-08-19

The browser talks only to same-origin `POST /api`. `_worker.js` owns compatibility normalization before forwarding JSON to the GAS Web App.

## Browser actions normalized by Worker

| Browser action | GAS action | Payload normalization |
| --- | --- | --- |
| `parse` | `analyze` | `rawText -> text`, `type -> inputType`; preserves `date` |
| `calendar` | `syncPlanCalendar` | preserves `id` |
| `calendarBulk` | `syncAllPlansCalendar` | GAS operates on all eligible unsynced dated plans; browser `ids` are not forwarded |
| `bulkPlans` | `batchPlans` | `operation -> kind`; preserves `ids` and `date` when supplied |

All other action names are forwarded unchanged. In particular, `skipRotation` must pass through unchanged to GAS.

## Known business-logic actions

`skipRotation` is intentionally **not** translated to `cancelPlan`. Rotation skip has different semantics: the current rotation frame is recorded as cancelled and, when cyclic, a new copy of the same `rotationOrder` is appended as pending so the skipped frame returns after later frames.

The GAS backend owns that behavior.

## Bulk postpone constraint

GAS `batchPlans(kind='postpone')` requires a target `date`. Worker normalization must not invent one.

If the browser sends `bulkPlans(operation='postpone')` without `date`, Worker returns HTTP 400 with `一括延期には延期後の日付が必要です。` and does not call GAS. Once the browser flow is safely changed to collect a date, the same request will normalize to `batchPlans` and pass the supplied date through.

## Protected boundary

- Browser keeps same-origin `/api`.
- GAS remains the owner of spreadsheet mutations and rotation business rules.
- Worker may normalize transport-level action/payload names and validate required transport fields, but must not implement spreadsheet business logic.
- Do not silently substitute `skipRotation -> cancelPlan` or invent a bulk-postpone date.
