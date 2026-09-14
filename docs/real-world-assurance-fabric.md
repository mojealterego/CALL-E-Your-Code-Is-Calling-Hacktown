# Real-World Assurance Fabric

The AegisFleet control plane is not merely a voice agent. It is an assurance layer around unreliable real-world execution. CALL-E is one execution adapter.

## 1. Claim Ledger

A conversational statement is not automatically a fact. Claims carry source, evidence, timestamp, confidence, authority, provenance, verification and an explicit epistemic status.

`CONVERSATIONAL CLAIM → AUTHORITATIVE CHECK → VERIFIED CLAIM`

The commit gate remains fail-closed. A CALL-E structured result is evidence, not proof by itself.

## 2. Evidence Graph

Every post-call claim is represented as a node linked to the transaction root. Provenance and evidence are retained so a reviewer can reconstruct why a decision was allowed or rejected.

## 3. Monitorability Score

Monitorability is treated as a safety variable. Lower observability reduces permitted authority:

- high → normal reconciliation
- medium → additional verification
- low → recover / human review

Principle: **the less we know about what actually happened, the less we are allowed to do.**

## 4. Trajectory Security

Safety is evaluated over the execution trajectory, not only the final event:

`observation → retrieval → model output → tool selection → state update → retry → escalation → side effect`

The regression suite rejects unsafe transitions such as retrying after an external side effect and multiple side effects in one logical transaction.

## 5. Compound Reasoning After the Call

Multiple parsers may inspect the raw conversation after the phone interaction. Agreement is a confidence signal; disagreement forces recovery. A majority is never treated as proof because correlated model errors can produce false consensus.

No multi-model deliberation is inserted into the live phone dialogue by default.

## 6. Epistemic Status Model

The domain distinguishes:

`TRUE | FALSE | UNKNOWN | UNVERIFIED | CONTRADICTED | STALE`

`UNKNOWN` is not equivalent to `FALSE`, and `UNVERIFIED` is not equivalent to `TRUE`. Contradictions and stale state remain visible rather than being silently overwritten.

## 7. Stale-State Protection

Prepared availability is versioned. Commit requires the prepared slot, state version and authoritative readback versions to match. A mismatch becomes `STALE → RECOVER`.

## 8. Side-Effect Conservation Invariant

One logical transaction may produce **zero or one external execution**.

`UNKNOWN CALL STATE → RECONCILE EXISTING EXECUTION → NEVER DUPLICATE SIDE EFFECT`

Uncertainty about whether a phone call happened must never itself cause another phone call.

## 9. Conversation Contract

Before execution, AegisFleet derives a versioned contract containing identity scope, objective, allowed actions, forbidden actions, required evidence, conditional evidence and commit conditions. The contract is hashed and becomes an explicit boundary for the phone executor.

## 10. Integration

`runIncident()` now builds the contract before execution and, after the call, constructs the Claim Ledger, Evidence Graph, Monitorability Score and trajectory-security result. The assurance result is advisory only until all existing policy, idempotency, structured-outcome and evidence gates pass.

The implementation is deterministic and testable. It does not claim external authoritative calendar access, learned model consensus, or proprietary Knowledge-projects internals.
