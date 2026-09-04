# Phase 9 — Release Engineering & Observability

## Goal
Make QGOS repeatably buildable, deployable and diagnosable.

## Gate checklist
- CI validates Prisma, lint, build and tests on every push/PR
- Node 24 runtime is used consistently by CI and production Docker
- Health endpoint remains available for container orchestration
- Production environment variables are documented
- Database migrations are deployable independently of application startup
- Logs contain operational context without secrets
- Release changes are traceable to signed/verified Git commits
- Rollback procedure is documented before production deployment

## Release rule
A release is not considered production-ready until the CI gate is green and environment-specific secrets/configuration have been supplied outside the repository.
