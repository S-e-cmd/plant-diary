# UI Rules

## Protected current behavior

- Mobile-first single-page layout with a maximum app width of 700px.
- Existing header, pinned work/weather area, tabs, cards, bottom navigation, modal behavior, and toast/processing feedback remain behaviorally compatible.
- Existing Japanese labels, form semantics, navigation order, and editing flows must not be renamed or rearranged merely for code cleanup.
- Desktop-specific behavior is additive through media queries; mobile behavior remains the primary layout contract.

## Change rules

- Preserve existing element IDs/classes and event targets when extracting code unless every dependent reference is updated and verified in the same change.
- Do not simplify or remove controls because they appear duplicated without confirming their runtime role.
- Do not change visual hierarchy, card density, responsive breakpoints, or interaction patterns during maintenance-only work.
- Functional UI changes require an explicit user request or confirmed required-propagation from that request.

## Validation

For UI-affecting changes, verify at minimum:

- page can load without a JavaScript parse/runtime bootstrap failure;
- current default tab renders;
- bottom navigation still switches intended views;
- forms and modal open/close paths remain reachable;
- `/api` requests remain same-origin and existing response handling is preserved;
- mobile-width layout does not introduce horizontal overflow.
