# Safe Workflow Execution Guide

This guide documents the first executable workflow subset in QGOS. It does not connect the external QueckGrow Job System or perform financial operations.

## 1. Create a workflow

Send `POST /ai/workflows` with the existing required workspace/user fields and a JSON-encoded `definition` string. The definition must contain a non-empty `steps` array.

Example definition value:

```json
{
  "steps": [
    {
      "id": "check_amount",
      "name": "Check requested amount",
      "type": "CONDITION",
      "operation": "gte",
      "path": "input.amount",
      "value": 10
    },
    {
      "id": "calculate_total",
      "name": "Calculate test total",
      "type": "TRANSFORM",
      "operation": "sum",
      "values": [10, 5],
      "dependsOn": ["check_amount"]
    }
  ]
}
```

The definition field in the API request is a string containing this JSON. Set the workflow to `PUBLISHED` using `POST /ai/workflows/:id/publish`.

## 2. Execute

Call `POST /ai/workflows/:id/execute` with a JSON body such as:

```json
{ "input": { "amount": 12, "customerRef": "TEST-001" } }
```

Execution is currently synchronous. The response reports the persisted execution status, output, and error (if any). Each completed step is saved as a Task row with status and output. The example's condition output is saved as a boolean; dependencies define order, not conditional branching.

## 3. Supported operations

- `TRANSFORM`: `set`, `copy`, `sum`, `concat`, `merge`.
- `CONDITION`: `exists`, `truthy`, `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`.
- `path` uses dot-separated paths against `input`, `steps`, or `step` in the execution context, for example `input.amount`.

Unknown steps, unsupported operations, missing dependencies, duplicate IDs, and dependency cycles are rejected. `AGENT_CALL`, `WEBHOOK`, and `DATA_FETCH` are intentionally disabled until adapters and access controls are implemented and tested.

## 4. Production limitations

- This is not yet a durable background worker/queue; process crashes can interrupt synchronous execution.
- External Job System integration is not configured. Do not add guessed URLs or secrets to the repository.
- This workflow subset has no financial side effects. Deposits, ROI/income posting, wallet credit, withdrawal approval, and payouts require separately reviewed services, idempotency, audit trails, reconciliation, and approval controls.
- Test only with synthetic data until end-to-end staging verification is complete.
