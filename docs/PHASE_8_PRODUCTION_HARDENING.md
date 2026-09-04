# Phase 8 — Production Hardening

## Goal
Harden the merged Phases 1–7 implementation for production use without changing business rules.

## Gate checklist
- Prisma schema validation and client generation
- TypeScript strict build
- ESLint clean
- Unit tests and e2e tests where infrastructure is available
- Financial idempotency and lifecycle checks
- Referral/network cycle and self-referral safeguards
- Admin authorization and privileged audit coverage
- Security headers, validation, CORS and secret configuration review
- Production Docker runtime aligned with the CI Node runtime
- Database migration/seed verification

## Non-negotiable rules
- No secrets committed to source control.
- No client-controlled financial status transitions.
- No balance mutation outside the financial service boundary.
- Financial operations must remain idempotent.
- Production configuration must replace all development placeholder credentials.
