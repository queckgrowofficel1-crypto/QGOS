# Phase 12 — Security, Observability & Production Operations

## Objective

Strengthen QGOS for real production operation after the Phase 11 handover gate.

## Scope

- Centralized structured application logging.
- Request correlation IDs for traceability.
- Production-safe error handling and diagnostics.
- Security-focused HTTP headers and configuration checks.
- Operational metrics and readiness checks.
- CI verification for the operational layer.
- Runbook for incident response and rollback.

## Implemented in source control

- Helmet security headers remain enabled for API requests.
- Production CORS requires an explicit `CORS_ORIGIN` configuration.
- Swagger remains disabled by default in production.
- Every request receives an `X-Request-Id`; an incoming value is preserved and a UUID is generated when absent.
- `/health` exposes the correlation ID when available.
- CI verifies that the compiled production process starts, `/health` returns successfully, and the response includes `X-Request-Id`.
- A production incident and rollback runbook is stored in `docs/OPERATIONS_RUNBOOK.md`.

## Completion gate

Phase 12 is complete when the operational changes are implemented, CI is green, the production build passes, and the runbook matches the deployed application behavior.

External infrastructure, credentials, monitoring vendors, backups, TLS and legal/compliance approvals remain deployment-owner prerequisites and are not represented as complete by source control alone.
