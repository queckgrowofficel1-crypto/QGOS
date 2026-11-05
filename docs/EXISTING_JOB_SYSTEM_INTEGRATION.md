# Existing QueckGrow Job System Integration Gate

## Current verified status

- API documentation/Swagger/Postman collection: **unknown; not present in the QGOS repository as of this review**.
- Staging access: **not yet available to the QGOS implementation; request it from the existing system's developer**.
- External Job System adapter: **not implemented or verified**. No external endpoint, auth scheme, payload format, or event semantics are assumed.
- Existing website, login/OTP, payment gateway, and database remain authoritative and are not replaced by QGOS.

## Required handoff from the existing-system developer

Request the following through the team's approved secure channel. Do not paste credentials into chat, issues, commits, or documentation.

1. OpenAPI/Swagger URL or exported JSON, or a Postman collection with a sanitized environment.
2. Staging base URL and access process, plus an approved test account/tenant.
3. Authentication method, required scopes/roles, token expiry/refresh behavior, and secret-manager location.
4. Read-only endpoints and events for job/project status, user/tenant identity, and permitted workflow operations.
5. Request/response examples, error codes, rate limits, pagination, webhook signature verification, and versioning policy.
6. Idempotency-key behavior, retry/backoff guidance, timeout limits, and duplicate-event handling.
7. Audit requirements and explicit authorization boundaries for any operation that can change a job, user balance, income, withdrawal, or payout.
8. Named technical owner and written approval for staging integration tests.

## Safe implementation plan

1. Review the API contract and map it to a versioned internal interface; do not infer routes or payloads.
2. Implement a dedicated adapter behind an interface, with configuration sourced from the secret manager and strict request/response validation.
3. Add mocked contract tests for success, auth failure, validation failure, timeouts, rate limiting, duplicate delivery, and malformed responses.
4. Run staging-only end-to-end tests with synthetic/non-financial data and record trace IDs without logging tokens or personal data.
5. Add bounded retries, idempotency, timeouts, observability, and an operator kill switch before any write-capable action.
6. Require separate legal/compliance review, least-privilege authorization, audit trail, reconciliation, and explicit human approval before enabling financial side effects.

## Current QGOS boundary

QGOS currently supports a deterministic synchronous workflow subset (TRANSFORM and CONDITION) and read-only business-plan evaluation. It does not call the external Job System and does not create deposits, investments, wallet credits, income postings, withdrawals, or payouts. External AGENT_CALL, WEBHOOK, and DATA_FETCH task types remain disabled until their adapters and access controls are reviewed and tested.

**Completion gate:** do not mark external integration complete or production-ready until the API contract is confirmed, staging tests pass, and the responsible developer signs off.
