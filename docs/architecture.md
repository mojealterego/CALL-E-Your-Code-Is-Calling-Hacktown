# AegisFleet Architecture

## Design objective

Treat a real phone interaction as an unreliable transaction participant rather than as an authoritative business action.

The system separates:

- **intent** — what the business wants to happen;
- **prepare** — the exact constraints that may be committed;
- **provider execution** — the real CALL-E phone interaction;
- **evidence** — what the terminal call result establishes;
- **reconciliation** — comparison of observed evidence with prepared intent;
- **commit / abort / recover** — the only permitted business dispositions;
- **audit** — a reconstructable record of the decision.

A language model never directly controls the consequential state transition.

## Runtime stages

1. **Incident intake** — an operational event identifies the participant, incident and proposed action.
2. **Policy gate** — validates identity, E.164 phone format, purpose and live-call restrictions.
3. **Idempotency reservation** — assigns a stable logical operation key before provider I/O.
4. **Prepare** — freezes the transaction ID, proposed route and maximum ETA.
5. **Provider execution** — dry-run simulation or CALL-E server SDK.
6. **Terminal verification** — require successful CALL-E completion before accepting evidence as a commit candidate.
7. **Evidence extraction** — retain structured result, terminal completion state and provider evidence.
8. **Reconciliation** — compare observed route, acceptance and ETA against the prepared transaction.
9. **Disposition**:
   - `commit` when all constraints match;
   - `abort` when terminal evidence conflicts with the prepared transaction;
   - `recover` when execution/evidence is incomplete or uncertain.
10. **Audit** — every transition is recorded in append-only hash-linked history.

## Transaction boundary

```text
Prepared business state
        │
        ▼
   CALL-E execution
        │
        ▼
Terminal evidence
        │
        ▼
  Reconciliation
   /      |      \
COMMIT   ABORT   RECOVER
```

The call itself is never the commit boundary.

## Why this is stronger than a raw voice-agent demo

The differentiator is not outbound calling. It is the **decision boundary around a real-world phone action**:

- the system can refuse execution before provider I/O;
- the provider result cannot directly mutate business state;
- a conflicting answer produces `abort` rather than an implicit success;
- `unknown` or incomplete execution produces `recover` rather than a blind retry;
- provider idempotency prevents duplicate logical calls during network retries;
- dry-run and live execution use the same business reconciliation pipeline;
- provider-specific behavior is isolated behind `src/calle.ts`.

## CALL-E integration

The prototype uses the CALL-E TypeScript server SDK for backend-controlled execution. The adapter supplies:

- an explicit E.164 recipient through `recipients`;
- region and locale;
- a bounded natural-language task;
- a strict structured result schema;
- caller-owned metadata containing the logical operation key;
- a stable provider idempotency key.

The terminal result provides the structured result together with `task_completed`, `completion_confidence`, `evidence`, failure information and recipient/attempt state. AegisFleet treats these as provider evidence, not as permission to commit.

## Webhooks and recovery

CALL-E terminal webhooks are notifications, not the authoritative business state. The current provider contract uses an event envelope with a top-level event ID and call-task ID in the event data. The `CALL-E-Event-Id` header must match the event ID; duplicate event IDs are rejected.

The production recovery path should re-fetch the authoritative call task using the CALL-E API before changing transaction state. A webhook alone must never cause a downstream write.

## MCP / API relationship

CALL-E also exposes a Streamable HTTP MCP integration with planning, execution and call-run retrieval capabilities. AegisFleet can use that interface when embedded in an agent host, while the current prototype uses the server SDK for deterministic backend orchestration.

The business transaction model is intentionally independent from whether CALL-E is reached through MCP, the server SDK, or the HTTP API.
