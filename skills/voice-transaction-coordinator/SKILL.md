---
name: voice-transaction-coordinator
description: Govern phone-call workflows that prepare, execute, reconcile, and commit or abort real-world transactions using explicit intent, bounded authority, structured evidence, idempotency, and human recovery. Use when a phone conversation can change an appointment, order, booking, dispatch, or other operational state.
---

# Voice Transaction Coordinator

Treat the phone call as an execution step, not as the business commit boundary.

## Control flow

```text
intent
  -> prepare
  -> authorize
  -> reserve idempotency key
  -> place exactly one bounded call
  -> collect terminal evidence
  -> validate structured outcome
  -> reconcile against prepared state
  -> COMMIT / ABORT / RECOVER
  -> emit receipt + audit record
```

## Required controls

1. Require explicit user intent for the transaction.
2. Validate recipients as E.164 numbers before provider I/O.
3. Keep phone numbers and credentials out of summaries and logs.
4. Create a stable operation/idempotency key before any provider request.
5. Scope authorization to the participant, endpoint, and exact transaction constraints.
6. Require a terminal provider state before treating execution as complete.
7. Validate structured results with a closed schema and explicit `unknown` values.
8. Never infer success from call connection, natural-language confidence, or missing fields.
9. Reconcile observed evidence with the prepared transaction before committing business state.
10. Route ambiguity, contradiction, incomplete evidence, policy failure, and execution failure to recovery or human review.
11. A retry must be replay-safe and must not create a duplicate logical transaction.
12. Make cancellation/rollback behavior explicit before allowing a consequential action.

## Decision rule

```text
COMMIT only when authoritative terminal evidence satisfies every transaction invariant.
ABORT when evidence proves the requested transaction cannot be committed safely.
RECOVER when execution or evidence is incomplete, contradictory, or uncertain.
```

A successful phone call is not equivalent to a successful business transaction.

## Recurring workflows

Keep recurrence in the host scheduler. The phone provider should execute one bounded call per scheduled run. Never hide a recurring schedule inside the skill.

## Safety boundary

For medical, legal, financial, emergency, identity-sensitive, or otherwise high-impact workflows, apply the host application's stronger policy and human-review requirements. This skill does not grant permission to bypass them.

## Provider portability

Provider-specific APIs, call states, webhook formats, and credential instructions belong in `references/`, not in this generic skill frontmatter or core decision rules.
