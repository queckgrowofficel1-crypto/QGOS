# Phase 10 — Final Release Gate

## Goal
Final technical release gate for QGOS after Phases 8 and 9.

## Required evidence
1. `main` contains the intended implementation.
2. Prisma validation passes.
3. Prisma client generation passes.
4. ESLint passes with no suppressed errors.
5. Production TypeScript build passes.
6. Unit tests pass.
7. E2E tests pass when a PostgreSQL test environment is available.
8. Docker image builds successfully.
9. `/health` returns HTTP 200 after startup.
10. No production secret or development credential is committed.
11. Financial and referral integrity checks are covered by automated tests.
12. Deployment and rollback procedures are documented.

## Final sign-off
The repository may be called **technically release-ready** only after the above evidence is verified. External legal/compliance, infrastructure, exchange, custody and third-party integration approvals remain deployment prerequisites and are not replaced by code CI.
