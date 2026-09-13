# AegisFleet — Voice Transaction Coordinator

**A governed transaction layer for real-world phone actions, built with CALL-E.**

AegisFleet treats a phone call as an unreliable real-world transaction participant. CALL-E performs the conversation; AegisFleet decides whether the evidence is sufficient to change the prepared business state.

> **Core boundary:** CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change.

> **Safety default:** `npm run demo` is fully local. It places zero phone calls and does not require a CALL-E API key.

## Transaction model

```text
INTENT
  ↓
PREPARE — freeze exact route + ETA constraint
  ↓
CALL — CALL-E contacts the authorized participant
  ↓
VERIFY — validate terminal state + structured evidence
  ↓
RECONCILE
  ├── COMMIT  → prepared operational state may change
  ├── ABORT   → evidence conflicts with the prepared state
  └── RECOVER → execution/evidence is incomplete; do not duplicate the call
```

The phone conversation is deliberately **not** the commit boundary. A positive conversational answer is insufficient unless it matches the prepared transaction constraints and CALL-E reports a successful terminal completion.

## Why this matters

Traditional voice automation often collapses three different facts into one:

1. the call happened;
2. the recipient said something;
3. the business system is now allowed to change.

AegisFleet separates them. This prevents an ambiguous, failed, duplicated, or conflicting call from silently becoming an operational state change.

## Implemented

- Explicit transaction preparation with immutable route/ETA constraints.
- CALL-E server SDK execution with E.164 recipients, region and locale.
- Provider-side idempotency key for safe retries of the same logical operation.
- Strict JSON Schema with explicit `unknown` states.
- Terminal `task_completed`, completion-confidence and CALL-E evidence captured from the provider result.
- Deterministic reconciliation producing `commit`, `abort` or `recover`.
- `RECOVER` for incomplete/uncertain provider execution instead of accidental retry-and-duplicate behavior.
- Append-only, hash-linked prototype audit history.
- Current CALL-E webhook envelope validation and event-ID/header binding.
- Deterministic dry-run path using the same validation and reconciliation pipeline.
- Regression tests for commit, conflict, recovery, idempotency and webhook safety.
- Explicit live-mode opt-in; no silent fallback from live to dry-run.

## Quick start

```bash
npm install
npm run demo
npm test
npm run typecheck
```

The demo uses a synthetic A4 closure incident and performs no provider I/O.

## Live CALL-E execution

1. Copy `.env.example` to `.env`.
2. Set `CALLE_API_KEY`.
3. Set `AEGIS_LIVE_PHONE` to an authorized E.164 test recipient.
4. Optionally set `CALLE_REGION` and `CALLE_LOCALE`.
5. Set `CALL_E_MODE=live`.
6. Run:

```bash
npm run live
```

Live execution is intentionally explicit because CALL-E can place real outbound phone calls. The server-side API key is never intended for frontend use.

## Example transaction receipt

```json
{
  "transactionId": "TX-AF-DEMO-0001",
  "decision": "commit",
  "prepared": {
    "route": "B",
    "maxEta": "19:00"
  },
  "observed": {
    "route": "B",
    "eta": "18:40",
    "acceptance": "yes",
    "confidence": "high"
  },
  "provider": {
    "callId": "call_123"
  }
}
```

The receipt is an **operational decision record**, not a claim of legal contractual binding.

## Failure semantics

### COMMIT

Only when the participant positively accepts the prepared change, the observed route matches the prepared route, the ETA satisfies the prepared maximum, evidence is sufficient, confidence is high, and CALL-E reports successful terminal completion.

### ABORT

Used when terminal evidence is complete but conflicts with the prepared transaction—for example, the participant accepts a different route.

### RECOVER

Used when the execution or evidence is incomplete or uncertain. Recovery must re-fetch/reconcile the existing CALL-E call before any new outbound call is considered.

## Architecture

```text
                    ┌─────────────────────┐
                    │  Prepared intent    │
                    │  route + ETA limit  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    AegisFleet       │
                    │ policy + idempotency│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       CALL-E        │
                    │ real phone runtime  │
                    └──────────┬──────────┘
                               │
                     terminal evidence
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Reconciliation   │
                    │ evidence vs intent  │
                    └──────┬─────┬─────┬──┘
                           /      │      \
                       COMMIT   ABORT   RECOVER
```

Provider-specific behavior is isolated in `src/calle.ts`. Business transaction policy lives independently in `src/transaction.ts` and `src/orchestrator.ts`.

## Repository layout

```text
.
├── .github/workflows/ci.yml
├── docs/
│   ├── architecture.md
│   ├── demo-script.md
│   ├── grant-proposal.md
│   └── security.md
├── src/
│   ├── calle.ts
│   ├── cli.ts
│   ├── domain.ts
│   ├── fsm.ts
│   ├── ledger.ts
│   ├── orchestrator.ts
│   ├── policy.ts
│   ├── simulator.ts
│   ├── transaction.ts
│   ├── validation.ts
│   └── webhook.ts
├── tests/
│   ├── ledger.test.ts
│   ├── orchestrator.test.ts
│   ├── policy.test.ts
│   ├── transaction.test.ts
│   ├── validation.test.ts
│   └── webhook.test.ts
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## CALL-E integration

The project uses the TypeScript server SDK `@call-e/calle`. The application passes the authorized E.164 recipient through CALL-E's `recipients` field, supplies region/locale, uses `resultSchema`, and sends a stable provider idempotency key. The current SDK exposes terminal `taskCompleted`, `completionConfidence` and `evidence` alongside the structured result.

CALL-E's current public SDK release is `0.7.0`; the project pins the dependency range to that current stable line rather than the older prototype `0.2.x` API. The generic one-shot Calls API remains the execution primitive used here.

## Security boundary

- API credentials stay server-side.
- Live execution requires an explicit environment flag and an explicit recipient phone.
- Fixture/example phone numbers are rejected in live mode.
- Webhook events are treated as untrusted notifications; event IDs are deduplicated and bound to the required header.
- Business state is never committed from a webhook alone; authoritative call state must be reconciled before committing.
- The prototype does not claim production RBAC, persistent enterprise storage, legal enforceability, or a production-grade webhook receiver.

## Demo target

The intended three-minute demonstration is:

```text
0:00  A4 closure creates an operational exception
0:15  PREPARE — Route B / ETA ≤ 19:00
0:30  CALL-E — real authorized phone call
1:10  EVIDENCE — Route B / 18:40 / accepted
1:30  RECONCILE
1:45  COMMIT
2:00  CONFLICT scenario → ABORT
2:25  UNKNOWN scenario → RECOVER
2:50  Final transaction receipt
```

The critical demonstration is that a phone call can produce evidence without being granted direct authority to mutate the business state.

## Production hardening backlog

- Durable transactional idempotency storage.
- Persistent audit storage and independent digest verification.
- Authoritative CALL-E re-fetch worker for webhook-driven reconciliation.
- RBAC and organization-level policy configuration.
- Secrets management and rotation.
- Retention/deletion and jurisdiction-specific privacy controls.
- Operator console and global kill switch.
- TMS/ERP write-back connectors.
- Fault injection, load testing and red-team evaluation.

## License

MIT
