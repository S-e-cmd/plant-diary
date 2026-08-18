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

All other action names are forwarded unchanged.

## Known business-logic actions

`skipRotation` is intentionally **not** translated to `cancelPlan`. Rotation skip has different semantics: the current rotation frame is recorded as cancelled and, when cyclic, a new copy of the same `rotationOrder` is appended as pending so the skipped frame returns after later frames.

The GAS backend must therefore implement `skipRotation` explicitly.

## Bulk postpone constraint

GAS `batchPlans(kind='postpone')` requires a target `date`. The current browser `bulkPlans` call does not supply one. Worker normalization must not invent a date. Until the browser flow collects a date, bulk postpone remains an explicit unresolved UI/API contract gap.

## Protected boundary

- Browser keeps same-origin `/api`.
- GAS remains the owner of spreadsheet mutations and rotation business rules.
- Worker may normalize transport-level action/payload names but must not implement spreadsheet business logic.
- Do not silently substitute `skipRotation -> cancelPlan` or invent a bulk-postpone date.
