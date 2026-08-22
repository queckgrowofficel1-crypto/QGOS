# Phase 5: Financial Operations & Income Engine

## Objective
Turn the existing Phase 1 financial schema into an operational, auditable NestJS domain layer without replacing or weakening the existing wallet, transaction, investment, deposit, withdrawal, or income data models.

## Existing foundation
The repository already contains the core Prisma entities required for this phase:

- Wallet and Transaction
- Package and Investment
- Deposit and Withdrawal
- ReferralIncome, BinaryIncome, MatchingIncome, and RankReward

Phase 5 therefore focuses on service behavior, API boundaries, atomic balance changes, history, validation, and tests rather than duplicating those database models.

## Workstreams

### 1. Wallet ledger
- Centralize balance mutations in a transaction-safe service.
- Require a deterministic transaction reference for idempotent operations.
- Prevent negative balances unless an explicit internal policy allows them.
- Update wallet totals and `lastTransactionAt` atomically with ledger creation.

### 2. Investment / top-up
- Validate package availability and amount limits.
- Create the investment and linked financial transaction atomically.
- Debit the source wallet only once per reference.
- Preserve pending/active lifecycle transitions.

### 3. Withdrawal workflow
- Create a pending withdrawal and reserve/debit the wallet atomically.
- Support approve, reject, and complete transitions.
- Reverse the reserved amount safely when a withdrawal is rejected.
- Record a linked transaction/audit reference for every state transition.

### 4. Income history
- Provide a normalized read layer over referral, binary, matching, and rank income records.
- Return chronological history and per-type totals without changing historical source records.

### 5. Rules engine boundary
- Define a deterministic input/output contract for multi-level income calculations.
- Keep percentage tables and qualification checks configurable instead of scattering constants through controllers.
- Use idempotency keys so a source event cannot generate the same income twice.

### 6. API and test coverage
- Add DTO validation.
- Keep controllers thin and business logic in services.
- Add unit tests for success, insufficient balance, duplicate reference, and lifecycle edge cases.

## Milestone definition

### Phase 5 - 25%
Financial module structure and wallet ledger service contract are in place.

### Phase 5 - 50%
Wallet ledger, transaction history, investment/top-up flow, and withdrawal request lifecycle are implemented and tested at the service layer.

### Phase 5 - 75%
Income history and configurable multi-level rules engine are integrated with idempotency safeguards.

### Phase 5 - 100%
Controllers, DTO validation, tests, CI verification, and production-readiness review are complete.

## Safety constraints
- No balance mutation outside the central financial service boundary.
- No duplicate processing for the same idempotency/reference key.
- No direct client-supplied status transition bypass.
- Decimal values remain Prisma Decimal-compatible until the API serialization boundary.
- Existing Phase 1 records remain backward compatible.
