# QGOS AI Army Readiness Audit

## Verified repository capabilities

- AI agent records can be created and listed per workspace.
- AI models are listed from the database.
- The provider adapter supports OpenAI when `AI_PROVIDER=openai` and `OPENAI_API_KEY` are configured.
- Workflow definitions can be created, published, and execution requests can be recorded.

## Current limits (do not describe as fully autonomous yet)

- Creating an agent record does not by itself prove that the agent has a published version, a configured model, permitted tools, or successful task runs.
- The workflow execute endpoint currently creates a `PENDING` execution record. It does not execute the workflow DAG in that request.
- The automation executor currently logs action names; it is not an integration with the external QueckGrow Job System.
- No live external Job System API contract/credentials are present in this repository. Do not guess endpoints or put credentials in source control.
- Business-plan endpoints are evaluation-only and must not trigger deposits, investments, wallet credits, income posting, withdrawals, or payouts.

## Readiness endpoint

Use `GET /ai/army/readiness?workspaceId=<workspace-id>` to check database-backed agent/model counts and runtime provider configuration. A `READY` response means the minimum configuration checks pass; it does not certify production readiness or prove that the external Job System is connected.

## Next engineering gates

1. Define and review the existing Job System's API contract (read-only test credentials, auth scheme, event formats, idempotency keys, and retry semantics).
2. Implement a provider adapter against that contract with mock-based contract tests.
3. Add a workflow DAG validator and worker that transitions executions and tasks through RUNNING/COMPLETED/FAILED, with persisted outputs and errors.
4. Keep financial effects behind explicit authorization, idempotency, audit records, and human approval until legal/compliance and reconciliation tests pass.
5. Run end-to-end tests in staging before enabling any production side effects.

The existing QueckGrow website, login/OTP, payment gateway, and user database are not replaced by QGOS.
