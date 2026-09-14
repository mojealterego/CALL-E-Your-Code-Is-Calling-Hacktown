# Recovered Material & Gap Register

Updated: 2026-09-14

This document records requirements and decisions recovered from the additional conversation screenshots supplied during final hackathon preparation. It is intentionally separate from implementation claims: an item is not marked complete merely because an architecture or document exists.

## 1. Submission-critical facts recovered from the material

### Official submission clock

- Devpost submission deadline shown in the supplied material: **14 September 2026, 23:45 SGT = 17:45 CEST (Poland)**.
- Stage One is pass/fail before Stage Two scoring.
- Stage Two criteria are presented as four equally weighted dimensions: Real World Impact, Quality of the Idea, Technical Implementation, and Product Experience & Demo.
- The project must be functional, use CALL-E through an accepted API/SDK or Skill/MCP path, be runnable as described, and remain available for jury testing through the evaluation period.
- The material states that the submission requires a public demo video below three minutes, CALL-E account email, and a PR URL to `CALLE-AI/awesome-phone-call-agents`.

These are requirements recovered from the supplied material. External submission state must still be verified on the live services before claiming completion.

### Additional CALL-E allocation request

The material identifies a separate earlier deadline for the official Additional Calls Request Form:

- **14 September 2026, 12:00 SGT = 06:00 CEST**.
- The request can ask for 200 additional CALL-E calls.
- Allocation is described as non-guaranteed and first-come, first-served.
- Processing may take 1–5 business days.
- The form requires email, first name, last name, country of residence, Devpost username, CALL-E account email, confirmation of prior CALL-E login, and 2–3 project sentences.

Operational rule: **do not depend on the additional 200 calls for the immediate demo**. Treat them as a future-test reserve if granted.

### Development freeze

The material proposes an internal **04:00 CEST development freeze** so remaining time can be used for verification, live call, demo recording, community contribution, Devpost submission and an emergency buffer. This is an internal risk-control milestone, not an official Devpost deadline.

## 2. Product narrative recovered from the material

The presentation should not lead with a catalogue of research names. The core message is:

> **CALL-E gives the agent a voice. AegisFleet gives that voice accountability.**

A key conceptual line:

> **An AI model may decide what it believes. It does not get to decide what becomes true.**

The demo should make the distinction between ordinary voice-agent success and governed execution immediately visible:

```text
TRADITIONAL VOICE AGENT       AEGISFLEET
CALL                          CALL
  ↓                             ↓
LLM                           EVIDENCE
  ↓                             ↓
"success"                     VERIFY
                                ↓
                              AUTHORIZE
                                ↓
                              READ BACK
                                ↓
                           COMMIT / ABORT / RECOVER
```

For the business audience, keep research technology names behind the implementation boundary. The jury should see the result and assurance mechanism rather than a buzzword inventory.

## 3. Demo requirements recovered from the material

The demo should visibly prove four things:

1. **Product** — a natural phone interaction rather than a code-first presentation.
2. **Intelligence** — structured claims/evidence extracted from the conversation.
3. **Assurance** — CALL-E result → claims → evidence → bitemporal state → reasoning/evidence graph → adversarial/formal gate → authoritative readback → decision.
4. **Business value** — one bounded call, one verified outcome and an auditable receipt.

A particularly strong negative-path demo is:

```text
CALL-E RESULT
  ↓
requested slot = unavailable
  ↓
CONTRADICTION / insufficient assurance
  ↓
RECOVER
```

A live CALL-E call must be a central element of the demo, not an optional add-on.

## 4. Repository separation — do not confuse the two CALL-E repositories

### `CALL-E-AI/call-e-integrations`

Use as the integration/configuration/reference repository for CALL-E SDK/API/MCP/CLI/Skill patterns. It is **not** the repository where the hackathon project contribution is submitted.

### `CALL-E-AI/awesome-phone-call-agents`

This is the submission/community-contribution target. Required flow:

```text
AegisFleet project repo
    ↓
working CALL-E demo
    ↓
community contribution
    ↓
fork owned by contributor (if upstream write permission is unavailable)
    ↓
commit + push
    ↓
Pull Request to CALL-E-AI/awesome-phone-call-agents
    ↓
PR URL copied into Devpost
```

The current connected GitHub identity does not have upstream push permission. Therefore **no upstream PR may be claimed until a real fork, push and PR URL exist**.

## 5. Recovered architecture decisions that must not be lost

### 5.1 One Meta-Architect Assurance Layer

The screenshots explicitly reject presenting the advanced capabilities as a "list of AI functions". The intended design is one coherent control layer strengthening the existing AegisFleet assurance boundary.

High-priority mechanisms recovered:

1. Negotiation Engine — negotiate only over **prepared, authoritative options**; never invent a new real-world slot.
2. Decision Matrix — compare resolve/escalate/recover using explicit policy, evidence, confidence and risk signals.
3. Risk / Confidence scoring — confidence is evidence-bounded and never sufficient by itself for COMMIT.
4. Adversarial decision checks — actively search for contradictory or disqualifying conditions before COMMIT.
5. Clarification loop — ambiguous phone results lead to clarification or RECOVER, not fabricated certainty.
6. Failure Memory — preserve prior failures as episodic evidence without allowing stale history to silently authorize an action.
7. Trajectory metrics — measure the complete transaction path, not merely model response quality.
8. Graceful degradation — loss of a capability degrades to a safer state such as RECOVER/ABORT rather than bypassing a gate.
9. Provider-agnostic capability adapter — isolate CALL-E/provider execution from policy authority and business commit logic.
10. Evidence → decision → receipt pipeline — every externally consequential decision must have a traceable evidence chain and receipt.

### 5.2 Meta-Architect Decision Loop

Recovered canonical flow:

```text
INTENT
  ↓
CONTEXT + MEMORY
  ↓
CLAIM LEDGER
  ↓
REASONING GRAPH
  ↓
POLICY / AUTH
  ↓
┌───────────────┬───────────────┐
│ ALLOWED       │ UNKNOWN       │
│ ↓             │ ↓             │
│ NEGOTIATION   │ RECOVER       │
│ ↓             │               │
│ PREPARE       │               │
│ ↓             │               │
│ CALL-E        │               │
│ ↓             │               │
│ AUTHORITATIVE │               │
│ READBACK      │               │
│ ↓             │               │
│ ADVERSARIAL   │               │
│ GATE          │               │
│ ↓             │               │
│ COMMIT/ABORT  │               │
│ ↓             │               │
│ RECEIPT       │               │
└──────┬────────┴───────────────┘
       ↓
MEMORY / GRAPH
```

This is the conceptual integration target for previously separate capabilities. A standalone adapter does not prove runtime integration.

### 5.3 Negotiation boundary

Recovered example:

```text
PATIENT: "Jutro nie dam rady."
AGENT:   "Rozumiem. Mogę sprawdzić najbliższy wolny termin."

PREPARED AVAILABILITY
09:00
11:30
08:30
13:00
10:30

NEGOTIATION ENGINE
preference → available options → ranking → proposal → acceptance
→ VERIFY → COMMIT
```

If 11:30 is rejected, select another **prepared** option. Do not invent 12:15 or any state outside the prepared contract. The LLM can negotiate language; the controlled system negotiates only over authoritative state.

### 5.4 Recursive Improvement Governance

Recovered design for capabilities 34/35/38/39:

```text
OBSERVED FAILURE
      ↓
TELEMETRY ANALYSIS
      ↓
BOTTLENECK / WEAKNESS
      ↓
IMPROVEMENT HYPOTHESIS
      ↓
AIR-GAPPED SANDBOX
      ↓
MUTATED / CANDIDATE VERSION
      ↓
TESTS + RED TEAM + FORMAL CHECK
      ↓
SHADOW RUN
      ↓
BASELINE VS NEW
   ↙             ↘
IMPROVEMENT      REGRESSION
   ↓                 ↓
PROMOTION           REJECT
CANDIDATE
   ↓
AUTHORIZATION GATE
   ↓
HUMAN / POLICY
   ↓
PROMOTE
```

Hard rule:

```text
CAPABILITY ≠ AUTHORIZATION
MODEL CONFIDENCE ≠ TRUTH
IMPROVEMENT ≠ PERMISSION
```

The system must never grant itself new privileges. No autonomous production source mutation, policy mutation, phone-authority transfer or self-approval is permitted.

### 5.5 Counterfactual Assurance

Recovered pre-COMMIT question:

> **What would have to be true for this decision to be wrong?**

Example counterfactuals:

1. Patient identity was misunderstood.
2. Patient actually rejected the appointment.
3. Doctor was not confirmed.
4. Selected reschedule slot was not prepared.
5. Provider reported completion incorrectly.
6. Conversation ended before confirmation.
7. Evidence contradicts the structured result.

Check these against Claim Ledger, GoT/reasoning graph, contradiction detection, formal gate, evidence and bitemporal facts. Counterfactual generation is an assurance mechanism, not a license to invent facts.

### 5.6 Offline Assurance Replay / "digital sleep"

Recovered direction:

- Do not simulate biological synaptic pruning.
- Select difficult historical cases such as `UNKNOWN`, `RECOVERED`, `CONTRADICTED`, `ABORT`, `LOW_CONFIDENCE`, and `FORMAL_GATE_FAILURE`.
- Replay them offline against current policy/assurance logic.
- Compare outcomes with historical outcomes.
- Use replay as evidence for regression detection and improvement proposals.

This must remain offline and must not create live phone side effects.

## 6. Current implementation state vs. remaining work

### Implemented in this repository

- Core governed CALL-E transaction flow.
- Conversation Contract and Claim/Evidence assurance layer.
- Semantic-memory/RAG-oriented bounded retrieval contracts.
- Graph-of-Thoughts/evidence-graph style bounded reasoning structures.
- Bitemporal state and stale-state recovery.
- Adversarial/formal invariant gates.
- Synthetic red-team coverage.
- Decision/COMMIT/ABORT/RECOVER boundary.
- Audit/receipt infrastructure.
- Bounded research-capability adapters and evolution roadmap.
- Rust SNN + optional Zenoh transport boundary.
- ImandraX-style formal verification boundary and bounded MARS reflection.
- Transcendence capability layers 70–99 as bounded, non-authoritative contracts.
- Deterministic dry-run demo with no phone/network side effects.
- Explicitly authorized live CALL-E workflow targeting current `main` and performing one transaction.
- Meta-architecture capability contracts for the previously enumerated 34–69 mechanisms.
- Reusable community skill package for governed phone transactions.

### Specifically recovered mechanisms requiring runtime/evidence reconciliation

These are **not automatically complete** merely because related contracts or documentation exist:

- [ ] Verify Negotiation Engine is connected to the actual appointment/transaction state machine and only consumes prepared availability.
- [ ] Verify Decision Matrix / risk-confidence scoring is on the actual COMMIT path rather than only available as a standalone module.
- [ ] Verify adversarial decision checks execute immediately before COMMIT and cannot be bypassed by a successful phone result.
- [ ] Verify clarification behavior for ambiguous phone outcomes and explicit unknown/recover transitions.
- [ ] Verify Failure Memory / episodic findings are recorded for terminal non-reused executions without changing authoritative incident state.
- [ ] Verify trajectory metrics cover prepare → call → evidence → verification → decision → receipt.
- [ ] Verify graceful degradation has explicit safe fallback states for missing capability/provider/evidence.
- [ ] Verify provider adapter boundaries prevent provider output from directly deciding business commit.
- [ ] Verify every COMMIT receipt contains the evidence/decision linkage needed for audit.
- [ ] Add/retain Counterfactual Assurance as an actual pre-COMMIT gate, or document its exact non-authoritative role if kept as a test-only layer.
- [ ] Add/retain Offline Assurance Replay over difficult historical cases and test that it has zero live side effects.
- [ ] Reconcile Recursive Improvement Governance with existing DGM/Digital Genotype/mutation contracts so it is one bounded proposal pipeline rather than multiple competing self-improvement loops.
- [ ] Ensure all advanced research labels remain honest implementation boundaries, not claims of reproducing proprietary systems.

### Not complete or not externally verified

- [ ] Confirm the Devpost account is registered/qualified for the hackathon.
- [ ] Submit the Additional Calls Request Form before its 06:00 CEST deadline if additional allocation is still desired.
- [ ] Confirm current CALL-E credits/allowance available for the final live test; do not assume additional 200 calls were granted.
- [ ] Perform/retain evidence for the final authorized live CALL-E test on current `main` if the previously recorded live test is not accepted as final evidence.
- [ ] Produce the final public demo video and ensure it is **under 3 minutes**.
- [ ] Publish the demo video to YouTube or Vimeo and retain the public URL.
- [ ] Create/use the contributor fork of `CALLE-AI/awesome-phone-call-agents`.
- [ ] Push the prepared community contribution to that fork.
- [ ] Open the actual upstream Pull Request.
- [ ] Record the actual PR URL in the submission package.
- [ ] Complete the Devpost project description, problem, solution, architecture, CALL-E account email, PR URL, video URL, optional demo URL, and test/live evidence fields.
- [ ] Complete the final Devpost submission and verify that it is actually submitted, not merely drafted.
- [ ] Perform a final clean-checkout verification from the exact submitted commit.
- [ ] Preserve final CI/test evidence and final commit SHA used for submission.

## 7. Important safety boundary

Advanced components such as Titans, JEPA, HDC, SNN, DGM, Digital Genotype, mutation loops and RSI must remain implementation adapters/roadmap layers unless a concrete, testable runtime implementation exists.

The submission must not claim that a research label means a proprietary model or research system has been reproduced. In particular:

- no autonomous production source mutation;
- no autonomous policy mutation;
- no autonomous phone-authority transfer;
- no fabricated ImandraX/JEPA/Titans/AlphaEvolve/DGM reproduction claims;
- no second live call when the state of the first external side effect is unknown;
- no COMMIT from memory, reasoning or confidence alone.

The operational architecture remains:

```text
CALL-E
  ↓
Conversation Contract
  ↓
R1 / R2 reasoning
  ↓
Semantic Memory / RAG
  ↓
Graph of Thoughts
  ↓
Claim / Evidence Graph
  ↓
Bitemporal State
  ↓
Adversarial Gate
  ↓
Decision Engine
  ↓
Authoritative Verification / Readback
  ↓
COMMIT / ABORT / RECOVER
  ↓
Receipt
```

## 8. Evidence discipline

This register distinguishes:

- **IMPLEMENTED** — represented by code/tests/docs in this repository.
- **VERIFIED** — backed by an actual reproducible run or external artifact.
- **OPEN** — requires an external action, additional evidence, or final verification.

No external PR, Devpost submission, video publication, additional-call allocation or live CALL-E execution should be marked complete without the corresponding real artifact/evidence.

## 9. Coverage ledger for the recovered capability series

The larger capability series must retain the distinction between being named, having a bounded contract, being runtime-integrated, and being externally verified.

| Range | Capability family | Repository status |
|---|---|---|
| 3–33 | Meta-architecture foundations | bounded contracts/tests documented; runtime relevance varies by mechanism |
| 34 | Genetic evolution / NAS / mutagenesis | bounded proposal/evolution governance; no self-authorized mutation |
| 35 | Counterfactual reasoning / causal assurance | design recovered; runtime gate integration requires reconciliation |
| 36 | Digital sleep / offline replay / pruning analogy | offline replay direction recovered; verify runtime implementation |
| 37 | Meta-learning / paradigm shifting / MAML | bounded capability contract/roadmap; not a claim of reproducing MAML research training |
| 38 | Homeostatic regulation / anti-reward hacking | bounded governance contracts; verify integration with reward/alignment checks |
| 39 | Neurosymbolic / formal proof gate | bounded formal boundary; ImandraX-style adapter is not proprietary implementation |
| 40–69 | Advanced assurance/meta-architecture capabilities | bounded contracts implemented; verify which are on the transaction path |
| 70–88 | ASI/transcendence capability series | bounded, deterministic, non-authoritative contracts |
| 89–99 | Further transcendence capability series | bounded, deterministic, non-authoritative contracts |

The project narrative must never equate this table with 99 independently deployed AI systems. The defensible claim is that AegisFleet has a governed architecture into which advanced techniques can be introduced without weakening the real-world action boundary.

## 10. Screenshot review record — latest supplied batch

The latest supplied batch contains 10 screenshots covering the following previously missing/recovered details:

- CI/typecheck chronology and the requirement to test critical transaction trajectories before live calling.
- The ten selected Meta-Architect mechanisms: negotiation, decision matrix, risk/confidence, adversarial checks, clarification, failure memory, trajectory metrics, graceful degradation, provider-agnostic adapter, and evidence→decision→receipt.
- The canonical Meta-Architect Decision Loop.
- The prepared-availability negotiation example and the explicit prohibition on inventing an unavailable time.
- Recursive Improvement Governance and its authorization boundary.
- Counterfactual Assurance and the seven concrete counterfactuals.
- Offline Assurance Replay / "digital sleep" as a safe implementation direction.

These details have now been incorporated into this register. This record is a **reconciliation register**, not a claim that every item above is already runtime-complete.
