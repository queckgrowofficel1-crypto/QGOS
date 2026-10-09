# QGOS AI Army Readiness Audit

## Implemented in the repository

- AI agent records can be created and listed per workspace.
- Available AI models are listed from the database.
- Runtime AI provider configuration is reported without exposing the key.
- Workflow definitions are validated before creation and publication.
- Workflow execution runs a safe, deterministic subset of workflow steps and persists each task and execution state/output.
- Supported safe steps: `TRANSFORM` operations `set`, `copy`, `sum`, `concat`, `merge`; and `CONDITION` operations `exists`, `truthy`, `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`.
- Dependency order is checked and dependency cycles/unknown dependencies are rejected.

## Explicit limitations

- `AGENT_CALL`, `WEBHOOK`, and `DATA_FETCH` are rejected until separately configured and tested adapters exist.
- The external QueckGrow Job System is not connected; its approved API contract and staging access are not present in this repository.
- Business-plan endpoints are evaluation-only and do not trigger deposits, investments, wallet credits, income posting, withdrawals, or payouts.
- This is a synchronous worker invoked by the execute endpoint, not a durable background queue. Production still needs a managed queue/worker, retries, timeout handling, and dead-letter handling.
- The readiness endpoint does not certify production readiness or prove that the external Job System is connected.

## Next engineering gates

1. Review and merge the implementation after CI and code review.
2. Define the existing Job System API contract (auth, event formats, idempotency keys, timeouts, retry semantics) and test it against staging.
3. Implement dedicated AI-agent and external Job System adapters with contract tests.
4. Add a durable queue/worker, cancellation, timeout/retry/dead-letter policies, and execution observability.
5. Keep financial effects behind explicit authorization, idempotency, audit records, and human approval until legal/compliance and reconciliation tests pass.
6. Run full staging end-to-end tests before enabling production side effects.

The existing QueckGrow website, login/OTP, payment gateway, and user database are not replaced by QGOS.
