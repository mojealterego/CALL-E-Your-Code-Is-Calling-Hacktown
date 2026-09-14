# Knowledge-projects → AegisFleet Assurance Fabric

Updated: 2026-09-14

This document records the architecture requirements recovered from the supplied Knowledge-projects material and the accompanying screenshot sequence. It distinguishes implemented runtime controls from design principles.

## Core principle

> **Evidence ≠ inference ≠ verified fact.**

CALL-E is a conversational evidence source. A structured result is a set of claims about what the conversation established; it is not, by itself, an authoritative business fact.

Canonical chain:

```text
CALL-E conversation
  ↓
observations / structured result
  ↓
claim ledger + provenance
  ↓
evidence graph + contradiction analysis
  ↓
authoritative readback / policy
  ↓
postcondition + invariant gate
  ↓
COMMIT / ABORT / RECOVER
```

## 1. Claim Ledger

Every consequential conversational claim must retain:

- claim / subject / predicate / value;
- source;
- evidence references;
- confidence;
- authority (`conversational`, `authoritative`, `derived`);
- verification state;
- provenance;
- temporal validity.

The implementation intentionally keeps a CALL-E claim `unverified` until an authoritative control verifies it. `formalGate()` remains the commit authority.

Example:

```json
{
  "claim": "appointment.confirmed",
  "value": "yes",
  "source": "call-e",
  "evidence": ["call_id", "conversation_turn", "structured_result"],
  "confidence": 0.95,
  "authority": "conversational",
  "status": "unverified"
}
```

A later authoritative readback can create a separate verified claim. This prevents a model interpretation from silently becoming a fact.

## 2. Evidence Graph

A conversation is represented as a graph rather than one flattened JSON answer.

Typical nodes:

- patient identity;
- appointment;
- doctor;
- attendance / decision;
- first visit;
- selected replacement slot;
- conversation completion.

Each claim retains value, source, timestamp, confidence, provenance, authority and verification state. Edges express support, derivation or contradiction.

The graph is evidence-oriented and judge-visible: a successful transaction should be explainable as a chain of verified claims, not merely as `structured_result = success`.

## 3. Monitorability as a safety variable

Monitorability is not merely dashboard telemetry. It controls how much authority the system may exercise.

```text
high monitorability   → normal reconciliation
medium                → additional verification
low                   → RECOVER / HUMAN REVIEW
```

The implementation computes dimensions for identity, appointment, doctor, decision, availability, completion and evidence. Missing, unknown, stale or contradicted claims reduce the score.

Principle:

> **Im mniej wiemy o tym, co wydarzyło się naprawdę, tym mniej wolno nam zrobić.**

## 4. Trajectory security

Security is evaluated over the complete execution trajectory, not isolated events:

```text
observation
→ retrieval
→ model output
→ tool selection
→ state update
→ retry
→ escalation
→ side effect
```

Required failure trajectories include:

```text
CALL START → wrong identity → disclosure → ABORT
patient says NO → model interprets YES → contradiction → ABORT / RECOVER
reschedule requested → unsupported time → hard contradiction
```

A retry after an external side effect and multiple external side effects are violations of the side-effect conservation invariant.

## 5. Compound reasoning after the call

Multiple parsers/reasoners are deliberately **not** placed in the live phone loop. The post-call assurance pipeline is:

```text
CALL-E
  ↓
raw conversation / structured result
  ↓
parser A   parser B   parser C
  ↓          ↓          ↓
structured claim envelopes
  ↓
agreement / contradiction
  ↓
claim graph
  ↓
reconciliation / verification
```

Agreement is a confidence signal, not proof. Correlated model errors mean `2 of 3 agree` cannot establish truth. Any material disagreement causes `RECOVER` rather than majority-vote commit.

## 6. Epistemic status

`unknown` is a first-class state and remains distinct from false, true and verified.

Supported assurance states:

```text
true
false
unknown
unverified
contradicted
stale
verified
```

Example:

```text
first_visit = YES
status      = unverified
authority   = conversational
```

After an authoritative verification:

```text
first_visit = YES
status      = verified
authority   = authoritative
```

If authoritative availability rejects a requested time:

```text
appointment_time = 11:30
status           = contradicted
```

## 7. Stale-state protection

Prepared availability is not assumed to remain current throughout a call.

The commit boundary compares:

- prepared slot;
- `slot_version`;
- `state_version`;
- authoritative readback timestamp.

```text
prepared_version == verified_version
  → eligible for COMMIT

otherwise
  → STALE → RECOVER
```

A stale readback may never silently overwrite newer state.

## 8. Side-Effect Conservation Invariant

Global invariant:

```text
UNKNOWN CALL STATE
  ↓
RECONCILE EXISTING EXECUTION
  ↓
NEVER DUPLICATE SIDE EFFECT
```

Formally for this transaction layer:

```text
1 logical transaction → 0 or 1 external execution
```

Uncertainty about whether a phone call completed must never cause a second phone call. Recovery therefore re-fetches and reconciles the existing CALL-E execution.

## 9. Conversation Contract

Before the call, the system generates a versioned contract containing:

- patient identity;
- objective;
- allowed actions (`confirm`, `reschedule`, `cancel`);
- forbidden actions;
- required evidence;
- conditional first-visit evidence;
- commit conditions;
- contract digest.

For the Medica Nova scenario:

```yaml
identity:
  patient: Adam Miauczyński

objective:
  confirm_appointment: true

allowed_actions:
  - confirm
  - reschedule
  - cancel

forbidden_actions:
  - invent_availability
  - invent_medical_information
  - disclose_before_identity
  - modify_unprepared_slot

required_evidence:
  - patient_identity
  - appointment_decision
  - doctor
  - conversation_completion

conditional_evidence:
  first_visit:
    yes:
      - identity_document_reminder
      - arrive_30_minutes_early
      - registration
      - information_form
    no: []
```

This makes the conversation an execution of a bounded contract rather than an unconstrained prompt.

## 10. Competition positioning

A healthcare appointment reminder alone is not the differentiator. The positioning is:

> **Nie budujemy kolejnego voice agenta. Budujemy assurance layer dla rzeczywistego świata, w którym telefon jest zawodnym uczestnikiem transakcji.**

Conceptual long-term architecture:

```text
REAL-WORLD ASSURANCE FABRIC
        │
   ┌────┼──────────────┐
 CALL-E  Ringostat  future adapters
   │        │             │
conversation telephony  email / SMS / human approval
 evidence   evidence     evidence
   └────────┼─────────────┘
            ↓
      EVIDENCE GRAPH
            ↓
     POLICY / AUTHORITY
            ↓
      COMMIT / ABORT / RECOVER
```

CALL-E remains one execution/evidence adapter. It does not become the authorization authority.

## Runtime status

Implemented on the active AegisFleet branch:

- claim ledger primitives and provenance;
- evidence graph;
- monitorability scoring;
- trajectory violation detection;
- post-call compound reasoning primitive;
- epistemic states including `unknown`, `unverified`, `contradicted`, `stale`, `verified`;
- stale prepared-state reconciliation;
- side-effect conservation helper;
- versioned conversation contract;
- formal commit gate;
- deterministic tests for the above.

These controls complement rather than replace the existing transaction ledger, idempotency reservation, capability binding, prepared availability, provider terminal-status checks, cryptographic receipt, webhook validation and recovery logic.

## Scope discipline

These controls are assurance primitives, not a claim that a production healthcare system has been deployed. Authoritative calendar/identity sources, enterprise RBAC, durable distributed deduplication and legal/compliance controls remain deployment-specific.
