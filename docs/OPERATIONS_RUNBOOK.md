# QGOS Production Operations Runbook

## Incident response

1. Record the incident time, affected endpoint/service, and the `X-Request-Id` value when available.
2. Check application logs without exposing credentials, tokens, authorization headers, or personal data.
3. Check `/health` for process availability.
4. If the release is unhealthy, stop promotion and roll back to the last known-good image/commit.
5. Preserve relevant logs and deployment metadata for post-incident review.

## Rollback

- Roll back the application image to the previous known-good immutable image tag or commit.
- Do not roll back database schema changes blindly. Review Prisma migration compatibility before any database rollback.
- Re-run `/health` after rollback and verify the returned `X-Request-Id` header.
- Confirm authentication, financial write paths, and administrative endpoints before reopening traffic.

## Security operations

- Keep `JWT_SECRET`, admin credentials/API keys, and database credentials outside source control.
- Set `NODE_ENV=production` in production.
- Set explicit trusted origins in `CORS_ORIGIN`.
- Keep `ENABLE_SWAGGER=false` in production unless temporary controlled access is explicitly required.
- Keep TLS termination and secure reverse-proxy configuration enabled at the deployment edge.

## Observability

Every request receives a correlation ID. A client-supplied `X-Request-Id` is preserved; otherwise QGOS generates a UUID and returns it in the response header. Use this identifier to correlate an API response with application logs and incident records.

The `/health` endpoint is a liveness check. It does not by itself prove database, payment, external-provider, or deployment-edge readiness.

## Release verification

Before production traffic is enabled, verify:

- CI is green on the release commit.
- Prisma validation and client generation pass.
- Lint, build, unit tests, and Docker build pass.
- The compiled production process starts successfully.
- `/health` returns HTTP 200.
- `X-Request-Id` is returned by the API.
- Production CORS is explicitly configured.
- Swagger is disabled by default in production.
- Database migrations are reviewed and applied through the deployment process.
- Backups, monitoring, alerting, TLS/domain, and incident ownership are configured outside the repository.
