# Financial write safety — integration preflight

The existing QueckGrow Job System, authentication/OTP, payment gateway, and user database are not modified by this change.

## Default behavior

All `POST /financial/*` endpoints and the `POST /admin/withdrawals/:id/{approve,reject,complete}` endpoints are fail-closed with `FinancialWriteGuard`. They require **both**:

1. An explicit server-side `FINANCIAL_WRITES_ENABLED=true` flag; default is disabled.
2. The existing server-side `AdminGuard` credentials (trusted `x-admin-key` and `x-admin-role: ADMIN`).

The flag is intentionally not set in source control. Never put admin credentials in a browser or public client. Do not enable the flag merely to make an endpoint work.

## Production approval gates

Before enabling writes, obtain the existing Job System API contract and staging credentials through an approved secret manager, verify actor identity/permissions and tenancy, review financial idempotency/ledger invariants, complete staging end-to-end tests, and obtain operator and applicable legal/compliance sign-off. The current header-based admin guard is a temporary internal-only control, **not** a replacement for the existing user identity system.

Read-only financial GET endpoints have not been changed by this patch. Their user-level authorization still needs to be verified against the existing system's identity contract before any public exposure.

Do not expose administrative or user-level financial endpoints publicly until authorization, identity mapping, and staging contract tests are verified.
