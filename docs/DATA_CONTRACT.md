# Data Contract

## Repository boundary

This repository does not contain the GAS source, spreadsheet schema, API keys, or spreadsheet configuration. Those external resources are existing dependencies and must not be recreated or migrated as part of ordinary code maintenance.

## Browser to Worker

- Route: same-origin `POST /api`.
- Request body: forwarded as text without transformation by `_worker.js`.
- Empty request body: HTTP 400 JSON error.
- Non-POST `/api`: HTTP 405 JSON error.
- `OPTIONS /api`: HTTP 204.

## Worker to GAS

- Method: `POST`.
- Content-Type: `text/plain;charset=utf-8`.
- Redirects: followed.
- Expected response: JSON text.
- Invalid/non-JSON upstream response: HTTP 502 JSON error.
- Transport failure: HTTP 502 JSON error.

## Worker response

- Content-Type: `application/json; charset=utf-8`.
- Cache-Control: `no-store`.
- Successful GAS response preserves the parsed JSON payload.
- GAS HTTP failure preserves the upstream status when a JSON response is available.

## Compatibility rules

- Do not change `/api`, request body shape, GAS endpoint behavior, response JSON shape, storage keys, spreadsheet columns, IDs, or date formats without confirmed evidence and an explicit scoped requirement.
- Do not infer unused fields or obsolete contracts from naming alone.
- If future work changes an API or persistence contract, update this document in the same change.
