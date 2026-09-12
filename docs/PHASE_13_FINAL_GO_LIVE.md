# Phase 13 — Final Go-Live / Production Launch

## Objective
Complete the final release gate for QGOS on top of the existing system. This phase does not redesign or replace the existing QuickGrow/QGOS architecture.

## Go-Live Checklist

### 1. Repository and release integrity
- [x] Existing QGOS implementation remains the source of truth.
- [x] Phases 1–12 implementation and operational documentation are committed.
- [x] Final CI run on `main` is green after the latest changes.
- [ ] Final release commit/tag is recorded.

### 2. Application verification
- [x] Production Node.js 24 build configuration is present.
- [x] Prisma validation/generation is part of CI.
- [x] PostgreSQL service and migrations are exercised in CI.
- [x] Unit-test execution is part of CI.
- [x] Production Docker image build is part of CI.
- [x] Compiled production process health smoke test is part of CI.
- [x] Request correlation (`X-Request-Id`) is verified by the smoke test.
- [x] Final CI passed all required repository/application checks without skipped required steps.

### 3. Production configuration
The deployment owner must configure real production values outside source control:
- [ ] `DATABASE_URL`
- [ ] Strong `JWT_SECRET`
- [ ] `ADMIN_API_KEY`
- [ ] `ADMIN_INITIAL_PASSWORD` only for controlled initial provisioning, then rotate/remove as appropriate
- [ ] Explicit trusted `CORS_ORIGIN`
- [ ] `NODE_ENV=production`
- [ ] `ENABLE_SWAGGER=false` unless temporary controlled exposure is explicitly required
- [ ] Production `PORT`/`HOST` and infrastructure-specific settings

No production secrets belong in Git.

### 4. Database launch gate
- [ ] Production database provisioned.
- [ ] Production migrations applied successfully.
- [ ] Seed/provisioning procedure reviewed and executed where required.
- [ ] Automated backup configured.
- [ ] Restore test completed successfully.
- [ ] Database access restricted to required services.

### 5. Domain and transport security
- [ ] Production domain configured.
- [ ] HTTPS/TLS certificate active.
- [ ] HTTP-to-HTTPS behavior verified at the deployment edge.
- [ ] Trusted CORS origins match the real frontend domain(s).
- [ ] Security headers verified in production.

### 6. Deployment
- [ ] Production container/image deployed.
- [ ] Deployment health check passes.
- [ ] API `/health` returns HTTP 200.
- [ ] Critical application APIs smoke-tested.
- [ ] Existing website/frontend integration verified.
- [ ] Financial and admin flows smoke-tested with non-production/test accounts before live use.

### 7. Observability and incident readiness
- [ ] Central application logs are collected.
- [ ] `X-Request-Id` can be traced through support incidents.
- [ ] Error-rate and availability alerts configured.
- [ ] Database/infrastructure alerts configured.
- [ ] On-call/owner contact path established.
- [ ] Rollback procedure from `docs/OPERATIONS_RUNBOOK.md` tested or rehearsed.

### 8. Security and governance sign-off
- [ ] No credentials/secrets committed.
- [ ] Admin access verified and restricted.
- [ ] Privileged operations remain auditable.
- [ ] Production CORS is explicit.
- [ ] Swagger is disabled by default in production.
- [ ] Legal/compliance requirements for the actual business operation have been reviewed by the responsible owner.

## Final Release Gate

QGOS may be marked **technically ready for production deployment** only when all repository/CI/application checks above are green and the deployment owner has completed the external infrastructure, secrets, database, domain/TLS, backup, monitoring, and business/compliance prerequisites.

GitHub code changes alone cannot provision external production infrastructure or credentials. Therefore, this phase separates **repository-complete** work from the final operator-controlled production launch.

## Current Status

**Phase 13 repository implementation/documentation: COMPLETE**

The repository-side technical release gate is green. The remaining unchecked items are external, operator-controlled production launch prerequisites: real production secrets/configuration, production database and backups, domain/TLS, deployment, monitoring/alerts, operational sign-off, and the final release tag.

The project should not be described as fully live until those external prerequisites are completed and verified.
