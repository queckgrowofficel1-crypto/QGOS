# Phase 11 — Production Handover & Operational Readiness

Phase 11 converts the technically release-ready QGOS codebase into a repeatable handover package.

## Scope

- Verify CI on the main branch.
- Smoke-test the compiled API and `/health` endpoint in CI.
- Keep Node 24 aligned across CI and production Docker.
- Keep production CORS explicit and Swagger disabled by default.
- Keep deployment configuration and rollback instructions documented.
- Remove stale documentation that describes the old TypeORM/Node 20 stack.
- Track remaining production prerequisites outside the repository separately.

## Handover gate

A Phase 11 handover is technically complete when:

1. Main branch CI is green.
2. Prisma validation and client generation pass.
3. Lint, build, unit tests, and Docker build pass.
4. A compiled production-style process starts successfully in CI.
5. `GET /health` returns HTTP 200 from that process.
6. Production CORS configuration is explicit.
7. Swagger remains disabled by default in production.
8. README and release documentation match the actual Node/Prisma/Docker stack.

## Outside-repository prerequisites

The following are deployment/operator responsibilities and cannot be truthfully marked complete from source control alone:

- Production PostgreSQL instance and credentials.
- Production JWT/admin secrets stored in the deployment secret manager.
- Trusted production CORS origins.
- TLS/domain/reverse-proxy configuration.
- Database migration execution against the production database.
- Infrastructure monitoring, backups, alerting and incident response.
- External legal/compliance/security review required for the business model.

## Current technical status

Phase 11 starts from a green CI baseline. The remaining work is verification and operational handover, not a claim that an external production environment has already been deployed.
