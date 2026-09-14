# AegisFleet — Voice Transaction Coordinator

**A governed transaction layer for real-world phone actions, built with CALL-E.**

AegisFleet treats a phone call as an unreliable real-world transaction participant. CALL-E performs the conversation; AegisFleet decides whether the evidence is sufficient to change the prepared business state.

> **Core boundary:** CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change.

> **Safety default:** `npm run demo` is fully local. It places zero phone calls and does not require a CALL-E API key.

## The key idea: voice is a transaction participant, not a commit authority

```text
INTENT → PREPARE → AUTHORIZE → CALL-E → READBACK → RECONCILE → COMMIT / ABORT / RECOVER → RECEIPT
                                  │
                                  └── evidence, never authorization
```

The phone conversation is deliberately **not** the commit boundary. A positive conversational answer is insufficient unless it matches the prepared transaction constraints and CALL-E reports successful terminal completion.

## Knowledge-projects → Assurance Fabric

The architecture recovered from the Knowledge-projects material is now encoded as executable assurance primitives, not only documentation:

```text
CALL-E
  ↓
CLAIM LEDGER + PROVENANCE
  ↓
EVIDENCE GRAPH + CONTRADICTION CHECK
  ↓
MONITORABILITY
  ↓
AUTHORITATIVE READBACK
  ↓
POSTCONDITION / FORMAL GATE
  ↓
COMMIT / ABORT / RECOVER
```

Key invariants:

- `EVIDENCE ≠ INFERENCE ≠ VERIFIED FACT`;
- conversational claims remain `unverified` until authoritative verification;
- `unknown` is distinct from false, true and verified;
- low monitorability reduces allowed authority;
- material parser disagreement causes `RECOVER`, not majority-vote commit;
- stale prepared state cannot silently overwrite newer state;
- `1 logical transaction → 0 or 1 external execution`;
- identity failure followed by disclosure is a trajectory violation;
- first-visit evidence is conditional rather than globally required.

The full recovered design is documented in [`docs/knowledge-assurance-fabric.md`](docs/knowledge-assurance-fabric.md).

## Evolution & Assurance Engine

AegisFleet does not treat failures as log entries that disappear after the run. A failed or uncertain trajectory becomes structured evidence for a controlled improvement loop:

```text
EXPERIENCE
   ↓
FAILURE / DRIFT
   ↓
HYPOTHESIS
   ↓
COUNTERFACTUAL + CHALLENGER
   ↓
SANDBOX / SHADOW
   ↓
BASELINE COMPARISON
   ↓
PROMOTION CANDIDATE
   ↓
EXPLICIT AUTHORIZATION
   ↺
```

Implemented safeguards include offline assurance replay, hard-negative regression cases, failure classification, trust degradation, temporal freshness checks, provider handshakes, adaptive load shedding that preserves verification, semantic cache entries that are explicitly **not** authorization-eligible, and throwaway sandbox artifacts.

The engine enforces a constitutional safety boundary:

- `CAPABILITY_NEVER_GRANTS_AUTHORIZATION`
- `UNKNOWN_NEVER_MEANS_SUCCESS`
- `UNVERIFIED_NEVER_COMMITS`
- `ONE_LOGICAL_TRANSACTION_MAX_ONE_EXTERNAL_EXECUTION`
- `WEBHOOK_NEVER_AUTHORIZES_STATE_MUTATION`
- `PREPARED_AVAILABILITY_ONLY`
- `MEMORY_NEVER_AUTHORIZES_EXECUTION`

An evolution candidate always requires explicit authorization; the improvement mechanism cannot promote itself.

## Why this matters

Traditional voice automation often collapses three different facts into one:

1. the call happened;
2. the recipient said something;
3. the business system is now allowed to change.

AegisFleet separates them. This prevents an ambiguous, failed, duplicated, stale, or conflicting call from silently becoming an operational state change.

## Implemented

- Explicit transaction preparation with immutable route/ETA constraints.
- Short-lived, operation-scoped capability bound to participant, authorized phone endpoint and exact constraints.
- CALL-E server SDK execution with E.164 recipients, region and locale.
- Provider-side idempotency key for safe retries of the same logical operation.
- Strict JSON Schema with explicit `unknown` states.
- Terminal `task_completed`, completion-confidence and CALL-E evidence captured from the provider result.
- Authoritative provider terminal status as a prerequisite for commit.
- Deterministic reconciliation producing `commit`, `abort` or `recover`.
- `RECOVER` for incomplete/uncertain provider execution instead of accidental retry-and-duplicate behavior.
- Cryptographic transaction receipts binding prepared transaction, scoped capability, observed evidence and final decision into SHA-256 digests.
- Append-only, hash-linked prototype audit history.
- Current CALL-E webhook envelope validation and event-ID/header binding.
- Deterministic dry-run path using the same validation and reconciliation pipeline.
- Evolution & Assurance Engine with replay, failure memory, counterfactual challenge, trust/freshness state and promotion gating.
- Claim Ledger, Evidence Graph, monitorability scoring, trajectory security checks, post-call compound-reasoning reconciliation, epistemic status, stale-state protection, side-effect conservation and versioned Conversation Contract.
- Regression tests covering safety invariants and the orchestrated transaction path.
- Explicit live-mode opt-in; no silent fallback from live to dry-run.

## Quick start

```bash
npm install
npm run demo
npm test
npm run typecheck
```

The default demo is local and performs no provider I/O.

## Trust plane

A phone number is an **execution endpoint**, not a complete participant identity or authorization grant.

```text
WHO   = participant identity
WHERE = authorized phone endpoint
WHAT  = transaction-scoped capability
```

Trust degradation can restrict or deny authorization, but trust never grants new authority. Memory and semantic cache can accelerate reasoning, but neither is authorization evidence.

## Transaction receipt

A terminal decision produces a receipt containing:

- `transactionDigest` — digest of the prepared transaction plus its scoped capability;
- `evidenceDigest` — digest of the authoritative observed evidence;
- `decisionDigest` — digest binding transaction, capability, evidence and `commit` / `abort` / `recover` together;
- `receiptId` — stable short identifier derived from the decision digest.

The receipt is an **operational decision record**, not a claim of legal contractual binding.

## Failure semantics

### COMMIT

Only when the participant positively accepts the prepared change, the observed evidence satisfies the prepared constraints, evidence is sufficient, and CALL-E reports successful terminal completion.

### ABORT

Used when terminal evidence is complete but conflicts with the prepared transaction.

### RECOVER

Used when execution or evidence is incomplete or uncertain. Recovery must reconcile the existing CALL-E execution before any new outbound call is considered.

## Architecture

```text
                    ┌─────────────────────┐
                    │   Prepared intent   │
                    │  exact constraints  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Capability Builder  │
                    │ scoped + expiring   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     CALL-E          │
                    │ phone execution     │
                    └──────────┬──────────┘
                               │
                         evidence only
                               │
                               ▼
              ┌────────────────────────────────┐
              │ Evolution & Assurance Engine   │
              │ replay · challenger · trust   │
              │ freshness · drift · sandbox   │
              └───────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Reconciliation    │
                    │  evidence vs intent │
                    └──────┬─────┬─────┬──┘
                           /      │      \
                       COMMIT   ABORT   RECOVER
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Transaction Receipt │
                    │ evidence + hashes  │
                    └─────────────────────┘
```

Provider-specific behavior is isolated in `src/calle.ts`. Business transaction policy lives independently in `src/transaction.ts` and `src/orchestrator.ts`.

## CALL-E integration

The project uses the TypeScript server SDK `@call-e/calle`. The application passes the authorized E.164 recipient through CALL-E's `recipients` field, supplies region/locale, uses `resultSchema`, and sends a stable provider idempotency key. Provider terminal lifecycle remains separate from business evidence so a non-terminal or failed provider state can never become a commit.

## Security boundary

- API credentials stay server-side.
- Live execution requires explicit environment configuration and an explicit recipient phone.
- Fixture/example phone numbers are rejected in live mode.
- Webhook events are treated as untrusted notifications; event IDs are deduplicated and bound to the required header.
- Business state is never committed from a webhook alone; authoritative call state must be reconciled before committing.
- Capability metadata is scoped and must not be confused with identity authentication.
- Semantic memory/cache is non-authoritative and cannot authorize execution.
- Stale state cannot silently overwrite a newer transaction state.
- Load shedding may remove optional computation, but never removes verification requirements.

## Demo target

The strongest three-minute demonstration is:

```text
0:00  Prepared real-world transaction
0:15  Capability + authorization boundary
0:30  CALL-E conversation
1:00  Authoritative evidence arrives
1:15  Challenger asks how the decision could be wrong
1:30  COMMIT only after verification
1:50  Prepared-slot negotiation / conflict → ABORT
2:15  Ambiguous execution → RECOVER, no duplicate side effect
2:35  Failure becomes replayable hard-negative memory
2:50  Cryptographic receipt + System State Manifest
```

The critical demonstration is that a phone call can produce evidence without being granted direct authority to mutate the business state.

## Production hardening backlog

- Durable transactional idempotency storage.
- Persistent audit storage and independent digest verification.
- External telephony evidence adapter where required.
- Enterprise identity/device-attestation adapter.
- RBAC and organization-level policy configuration.
- Secrets management and rotation.
- Retention/deletion and jurisdiction-specific privacy controls.
- Operator console and global kill switch.
- TMS/ERP write-back connectors.
- Fault injection, load testing and red-team evaluation.

## License

MIT
