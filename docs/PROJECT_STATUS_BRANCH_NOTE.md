# Prepared Runtime Switch Batch

Branch: `agent/log-date-runtime-switch`

This branch prepares the guarded runtime switch for log/plan date helpers without changing production runtime behavior yet.

Prepared items:

- fail-closed apply command for `index.html`;
- log contract test that accepts both staged and switched states while preserving paging/search/sort contracts;
- dry-run test that accepts both staged and switched states;
- extraction runbook with pre-check, apply, post-check, and rollback requirements.

The temporary GitHub Actions workflow used to attempt connector-side execution was removed because runs were not triggered through the available connection path. The runtime build remains `20260809-02` on this branch until the apply command is executed in a checkout where `npm test` can run before and after the change.
