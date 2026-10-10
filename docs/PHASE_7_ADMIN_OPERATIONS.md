# Phase 7 — Admin Control & Operations Center

## Repository implementation status

The admin API provides a guarded operations summary, user administration, and a pending approval queue. The following read-only observability endpoints are available on the current branch:

- `GET /admin/summary` — user, wallet, investment, transaction, withdrawal, audit, and pending-approval counts.
- `GET /admin/audit-logs?page=1&limit=25` — newest-first audit history. `limit` is capped at 100; optional `entity`, `action`, and `status` filters are supported.
- `GET /admin/income-monitoring` — record counts and Decimal-safe amount totals for referral, binary pair-bonus, matching, and rank-reward records, including unprocessed queue totals.
- `GET /admin/network-summary` — active/non-deleted member and referral relationship counts.
- `GET /admin/approvals` — pending withdrawal, investment, and transaction queues.
- `GET /admin/users` and `PATCH /admin/users/:userId` — user administration.

All routes remain behind `AdminGuard`. The new monitoring endpoints are read-only and do not credit wallets, calculate or post income, approve withdrawals, or change member relationships.

## Verification and launch gates

- Unit tests cover audit filtering/pagination and the new read-only monitoring summaries.
- CI must pass on the final branch head.
- Admin authentication must be configured with a strong secret outside source control and restricted to trusted server-side callers. Do not expose `ADMIN_API_KEY` in browser code.
- User status/role changes and financial approval transitions must be reviewed with the responsible operator before production use.
- This document does not mark external Job System integration or production deployment complete; those require the existing system developer's API contract and staging verification.
