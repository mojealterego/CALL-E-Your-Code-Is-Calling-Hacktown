# 69-page architecture analysis ledger

Updated: 2026-09-14

This ledger records the architecture decisions recovered from the supplied 69-page material and the preceding design discussion. It is a **requirements ledger**, not a claim that every item is already runtime-complete. Implementation status must be checked against code/tests/CI.

## Core thesis recovered before the numbered capability series

The material consistently converges on one principle:

> **CALL-E gives the agent a voice. AegisFleet gives that voice accountability.**

The phone channel is treated as an unreliable observation/execution boundary. A model can produce an interpretation, but it cannot by itself establish a real-world fact or authorize a consequential state transition.

Canonical assurance chain:

```text
INTENT
  ↓
CONTEXT + MEMORY
  ↓
CLAIM LEDGER
  ↓
REASONING / EVIDENCE GRAPH
  ↓
POLICY + AUTHORIZATION
  ↓
TYPED CAPABILITY
  ↓
PREPARED STATE
  ↓
CALL-E
  ↓
AUTHORITATIVE READBACK
  ↓
COUNTERFACTUAL / ADVERSARIAL CHECK
  ↓
FORMAL / INVARIANT GATE
  ↓
COMMIT / ABORT / RECOVER
  ↓
RECEIPT + AUDIT
  ↓
EPISODIC MEMORY / REGRESSION
```

The most important semantic separation is:

```text
MODEL BELIEF       ≠ FACT
MEMORY             ≠ AUTHORIZATION
CONFIDENCE         ≠ PROOF
CAPABILITY         ≠ PERMISSION
IMPROVEMENT        ≠ SELF-AUTHORIZATION
```

## Pre-series design decisions

### Real-World Assurance Fabric

The material proposes turning every conversation into an evidence-bearing transaction rather than treating the CALL-E structured result as unquestionable truth.

Required objects:

- Conversation Contract
- Claim Ledger
- Evidence Graph
- Monitorability Score
- authoritative readback
- stale-state protection
- explicit epistemic states
- trajectory security
- side-effect conservation
- post-call compound reasoning
- auditable receipt

### Claim Ledger

A result such as `appointment_confirmed=yes` becomes a structured claim with at least value, source, timestamp, confidence/provenance and authority/verification state. The claim remains unverified until the transaction gates establish sufficient evidence.

### Evidence Graph

A conversation can be represented as linked claims such as patient identity, appointment, doctor, attendance decision, first-visit status, selected slot and conversation completion. Each claim carries provenance and verification metadata.

### Monitorability Score

Monitorability is a safety variable, not merely a dashboard metric. Missing identity, appointment, decision, availability, completion or evidence reduces the ability to safely reconcile the transaction and should push the system toward additional verification or RECOVER.

### Unknown is first-class

`UNKNOWN` must remain distinct from `FALSE`, `TRUE`, `VERIFIED`, `UNVERIFIED`, `CONTRADICTED` and `STALE`. Ambiguity is not permission to guess.

### Stale-state protection

Prepared state must be versioned and checked against authoritative current state. Newer state cannot be silently overwritten by an older prepared fact.

### Side-Effect Conservation Invariant

```text
1 logical transaction
→ 0 or 1 external execution
```

If external execution state is unknown, reconcile the existing execution. Never create a blind second call merely because the first call's result is uncertain.

### Compound reasoning placement

Multiple reasoning passes belong **after** the phone interaction when possible. The live conversation should remain natural and low-latency. Post-call reasoning can compare independent interpretations, contradiction signals and evidence. Agreement is a confidence signal, never proof; correlated model errors prevent majority vote from becoming authority.

### Conversation Contract

The contract bounds the phone agent before execution. For the recovered appointment example it includes identity, objective, allowed actions (`confirm`, `reschedule`, `cancel`), forbidden actions (inventing availability/medical information, disclosure before identity, modifying unprepared slots), required evidence and conditional evidence.

## Capability series recovered from the supplied material

### 34 — Genetic evolution / NAS / mutagenesis

Use evolution as a **candidate-generation mechanism**, not as autonomous production mutation. Candidate changes remain sandboxed and must pass tests, red team, formal/property checks, benchmark/shadow comparison and explicit authorization.

### 35 — Counterfactual reasoning / causal inference

Before COMMIT ask:

> What would have to be true for this decision to be wrong?

Examples include identity misunderstanding, rejected appointment, unconfirmed doctor, unprepared slot, incorrect provider completion, incomplete conversation and contradictory evidence.

### 36 — Digital sleep / offline assurance replay

Do not pretend to implement biological synaptic pruning. Periodically replay the hardest historical cases offline (`UNKNOWN`, `RECOVER`, `CONTRADICTED`, `ABORT`, `LOW_CONFIDENCE`, formal-gate failures) against current policy/model/verifier and detect regressions. Offline replay has zero live phone side effects.

### 37 — Meta-learning / paradigm-shift detection

Full MAML is not required for the competition. The valuable runtime mechanism is detecting when model assumptions or provider output semantics have changed:

```text
NORMAL DRIFT
→ ANOMALY
→ HIGH ANOMALY
→ MODEL ASSUMPTIONS INVALID
→ FREEZE AUTONOMOUS PROMOTION
→ REVALIDATE
```

Do not learn a new behavior blindly when the interface or environment changes.

### 38 — Homeostatic regulation / anti-reward-hacking

Monitor failure rate, unknown rate, recovery rate, contradiction rate, provider error rate, latency, verification failures, duplicate attempts and confidence degradation.

Suggested authority degradation:

```text
NORMAL
→ DEGRADED
→ RESTRICTED
→ RECOVERY ONLY
→ HUMAN REVIEW
```

Compute may degrade; assurance must not be silently degraded because the system is overloaded.

### 39 — Neuro-symbolic integration / formal gate

Separate probabilistic language reasoning from symbolic constraints:

```text
LLM hypothesis
→ symbolic policy / constraints
→ formal gate
→ continue OR reject
```

Example constraints include patient confirmation, completed conversation, provider completion, evidence existence, appointment decision and absence of contradiction.

### 40 — Meta-identity / System State Manifest

Use a versioned machine-readable manifest containing provider, capabilities, authorization scope, policy version, known failures, trust state, verification state, active constraints and promotion state. It is technical state, not anthropomorphic consciousness.

### 41 — Semantic cache

Cache can accelerate reasoning but can never authorize execution:

```text
similar prior case
→ cached reasoning
→ NOT trusted as truth
→ revalidate against CURRENT state
→ use / reject
```

### 42 — Latent-space communication

Potential optimization for agent-to-agent/internal communication, but it must remain behind explicit typed boundaries. It cannot bypass evidence or authorization.

### 43 — Cross-examination

After a primary result, generate a bounded challenger question such as:

```text
PRIMARY RESULT
→ CHALLENGER
→ counterexamples
→ formal gate
```

This combines naturally with counterfactual and neuro-symbolic verification.

### 44 — Constitutional refusal

Use non-overridable safety invariants. A normal prompt cannot say “skip verification and commit” when an invariant is violated:

```text
REQUESTED ACTION
→ POLICY
→ INVARIANT VIOLATION
→ DENY
```

### 45 — Temporal decay

Use bitemporal facts plus freshness rather than deleting old information. Old does not mean false; it means potentially stale and requiring appropriate verification.

### 46 — Dynamic resource donation

Under load, lower-priority compute can be shed or donated while preserving the assurance core. Never sacrifice verification solely to reduce resource pressure.

### 47 — Prompt compression / token pruning

Compress context by preserving policy, active constraints, evidence and relevant state. Do not compress away the fields required for safe authorization.

### 48 — Hard-negative mining

Every critical failure becomes a future regression case:

```text
FAILURE
→ CLASSIFY
→ STORE
→ REPLAY
→ REGRESSION TEST
```

A failure is not merely logged; it becomes a barrier against recurrence.

### 49 — Multimodal fusion

Where additional modalities exist, fuse them through explicit provenance and confidence. A second modality does not automatically override a contradictory primary source.

### 50 — Adaptive load shedding

```text
NORMAL
→ LOAD ↑
→ LOW-PRIORITY REQUESTS SHED
→ CORE ASSURANCE PRESERVED
```

### 51 — Zero-shot domain adaptation

Domain changes require bounded adaptation and verification, not silent assumption changes. New domain behavior must remain behind the same policy/evidence boundary.

### 52 — Cross-system handshake

Provider use should follow a zero-trust capability handshake:

```text
AegisFleet
→ capability contract
→ provider adapter
→ CALL-E / other provider
```

Provider must expose capabilities, schema, limits, execution semantics and verification semantics before use.

### 53 — Chaos engineering

Inject provider failures, malformed results, stale state, replay and partial completion in deterministic tests. Chaos testing must validate safe degradation rather than merely uptime.

### 54 — Vector topology mapping

Represent related concepts/claims as a bounded topology so disconnected or anomalous clusters can be detected. The output is analytical, not an authorization source by itself.

### 55 — Automated firewalling

Automatically quarantine unsafe/untrusted tool paths and prevent them from reaching production authority. Firewall decisions remain explicit and auditable.

### 56 — Pareto optimization

Do not select “the best model” by one score. Evaluate the Pareto frontier over reliability, latency, compute/cost and verification coverage. A candidate with one superior metric can still be rejected because it regresses another critical dimension.

### 57 — Infinite-horizon planning / MCTS

Use bounded planning horizons for complex choices. No unbounded search loop and no authority transfer from planner to executor.

### 58 — Controlled noise

Use bounded perturbation to test robustness and expose brittle assumptions. Never inject uncontrolled noise into production authorization state.

### 59 — Legacy bridging

Adapters can translate old systems into typed modern contracts. The bridge must preserve authority boundaries and provenance.

### 60 — Pretrained concept retention

Retain stable domain concepts while allowing current-state facts to update. Historical knowledge is not a substitute for current authoritative state.

### 61 — Offline fallback

When the provider/network is unavailable, fall back to deterministic local policy, queued reconciliation or RECOVER. Never silently simulate a completed external action as if it occurred.

### 62 — Curriculum learning

Prioritize training/evaluation cases by difficulty and failure history. For this project, hard-negative replay is the practical competition-ready version.

### 63 — Vector memory defragmentation

Periodically consolidate duplicate/near-duplicate memory records while preserving provenance, supersession and bitemporal history.

### 64 — Schema alignment

Provider/model schema changes require explicit alignment and validation. Unknown fields and incompatible semantics must not be silently coerced into success.

### 65 — Dynamic modality switching

Switch between reasoning modes based on context, latency and evidence requirements, but retain a common policy/authorization boundary.

### 66 — A/B testing

Prefer shadow evaluation before real production A/B. Candidate receives no production authority merely because its score is higher:

```text
PRODUCTION INPUT
├─ BASELINE
└─ CANDIDATE
      ↓
    SHADOW
      ↓
 compare outputs
      ↓
 verifier
      ↓
 promotion score
      ↓
 policy gate
```

### 67 — Trust degradation

Trust is a restriction signal, not permission:

```text
1.00 NORMAL
0.85 RESTRICTED
0.65 SHADOW ONLY
0.40 SANDBOX
0.00 DISABLED
```

Authorization still comes only from policy/capability controls.

### 68 — Throwaway tools

Generated tools may be created for a bounded task, executed in a sandbox, inspected and destroyed. No automatic installation into the production system.

### 69 — Meta-architecture generation

The material explicitly rejects uncontrolled “designing the processor/system itself” as a competition claim. Meta-architecture generation is useful as a governed proposal mechanism only. The practical target is a controlled evolution loop:

```text
EXPERIENCE
→ TELEMETRY
→ FAILURE / DRIFT
→ HYPOTHESIS
→ COUNTERFACTUAL TEST
→ MUTATION / CANDIDATE
→ SANDBOX
→ RED TEAM
→ FORMAL VERIFICATION
→ SHADOW REPLAY
→ BASELINE COMPARISON
→ PARETO EVALUATION
→ PROMOTION CANDIDATE
→ AUTHORIZATION GATE
→ PROMOTE
→ NEW BASELINE
→ EXPERIENCE
```

The assurance core remains separate:

```text
ASSURANCE CORE
├─ MEMORY → SEMANTIC RAG
├─ EVIDENCE → CLAIM LEDGER
└─ POLICY → AUTHORITY CONTROL
          ↓
    DECISION ENGINE
      ├─ COMMIT
      ├─ ABORT
      └─ RECOVER
```

## Appointment-specific conversation recovered from the material

The later concrete CALL-E scenario is not a separate toy example; it is the preferred natural-language validation of the architecture.

### Confirmed first visit

```text
Anna z Przychodni Medica Nova
→ identity confirmation: Adam Miauczyński
→ tomorrow's appointment with Dr Pawlak
→ first visit? YES
→ identity document reminder
→ arrive ~30 minutes early
→ registration
→ information form
→ “Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?”
→ “Nie.”
→ natural close
```

### Confirmed returning visit

If the answer is NO, do **not** repeat first-visit instructions. Confirm that everything is in order and proceed to the final-help question and natural close.

### Patient cannot attend

Do not terminate immediately. Ask whether the patient wants to reschedule or cancel.

### Reschedule

Only negotiate over `preparedAvailability`. The language model may conduct the conversation, but it may not invent a slot. Rejected times cause another prepared option to be considered; an unavailable day causes the next prepared day to be offered. A selected slot is committed only after authoritative availability verification.

### Cancel

If the patient does not want the appointment, cancel without pressure and close naturally. Do not continue artificial questioning.

## Competition positioning recovered from the material

The market already contains ordinary appointment reminders, information-verification agents, abstention systems, consent-gated workflows, callback agents, event-driven calls, telephony verification and escalation patterns.

Therefore the differentiator is not:

> “CALL-E + healthcare appointment.”

The stronger category is:

> **Real-World Assurance Fabric for AI agents acting through unreliable communication channels.**

The jury-facing story should emphasize one verifiable loop rather than a catalogue of research names.

## Implementation discipline

The numbered capabilities should not be treated as 36 unrelated features. They form one governed Evolution & Assurance subsystem around the transaction core.

Required invariant set:

```text
CAPABILITY ≠ AUTHORIZATION
CONFIDENCE ≠ TRUTH
MEMORY ≠ CURRENT STATE
CACHE ≠ EVIDENCE
PROVIDER RESULT ≠ AUTHORITATIVE FACT
UNKNOWN ≠ FALSE
IMPROVEMENT ≠ PERMISSION
```

The safe recursive-improvement protocol is:

```text
OBSERVE
→ PROFILE
→ HYPOTHESIS
→ GENERATE CANDIDATE
→ AIR-GAPPED SANDBOX
→ SYNTHETIC RED TEAM
→ FORMAL / PROPERTY CHECKS
→ BENCHMARK
→ SHADOW
→ HUMAN / POLICY APPROVAL
→ ATOMIC RELEASE
→ ROLLBACK
```

No autonomous production source mutation, policy mutation, privilege expansion, phone-authority transfer or self-approval is allowed.

## Status semantics

This ledger deliberately separates:

- **DESIGN RECOVERED** — requirement is captured here.
- **IMPLEMENTED** — code exists.
- **RUNTIME-INTEGRATED** — code is on the authoritative transaction path.
- **TESTED** — regression test covers it.
- **VERIFIED** — actual CI/live evidence proves the claim.

A feature is not “done” merely because its name appears in a TypeScript file.
