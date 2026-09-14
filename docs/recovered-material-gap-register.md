# Recovered Material & Gap Register

Updated: 2026-09-14

This document records requirements and decisions recovered from the additional conversation screenshots supplied during the final hackathon preparation. It is intentionally separate from the implementation claims: an item is not marked complete merely because an architecture or document exists.

## 1. Submission-critical facts recovered from the material

### Official submission clock

- Devpost submission deadline shown in the supplied material: **14 September 2026, 23:45 SGT = 17:45 CEST (Poland)**.
- Stage One is pass/fail before Stage Two scoring.
- Stage Two criteria are presented as four equally weighted dimensions:
  1. Real World Impact
  2. Quality of the Idea
  3. Technical Implementation
  4. Product Experience & Demo
- The project must be functional, use CALL-E through an accepted API/SDK or Skill/MCP path, be runnable as described, and remain available for jury testing through the evaluation period.
- The material states that the submission requires a public demo video below three minutes, CALL-E account email, and a PR URL to `CALLE-AI/awesome-phone-call-agents`.

These are submission requirements recovered from the supplied material. External submission state must still be verified on the live services before claiming completion.

### Additional CALL-E allocation request

The material identifies a separate earlier deadline for the official Additional Calls Request Form:

- **14 September 2026, 12:00 SGT = 06:00 CEST**.
- The request can ask for 200 additional CALL-E calls.
- Allocation is described as non-guaranteed and first-come, first-served.
- The material states that processing may take 1–5 business days.
- The form requires email, first name, last name, country of residence, Devpost username, CALL-E account email, confirmation of prior CALL-E login, and 2–3 project sentences.

Operational rule recovered from the material: **do not depend on the additional 200 calls for the immediate demo**. Treat them as a future-test reserve if granted.

### Development freeze

The material proposes an internal **04:00 CEST development freeze** so that the remaining time can be used for verification, live call, demo recording, community contribution, Devpost submission and an emergency buffer.

This is an internal risk-control milestone, not an official Devpost deadline.

## 2. Product narrative recovered from the material

The presentation should not lead with a catalogue of research names. The core message is:

> **CALL-E gives the agent a voice. AegisFleet gives that voice accountability.**

The stronger positioning is an **assurance layer for AI agents that take real-world actions over unreliable communication channels**.

A key conceptual line recovered from the material:

> **An AI model may decide what it believes. It does not get to decide what becomes true.**

The demo should make the distinction between ordinary voice-agent success and governed execution immediately visible:

```text
TRADITIONAL VOICE AGENT
CALL
  ↓
LLM
  ↓
"success"

AEGISFLEET
CALL
  ↓
EVIDENCE
  ↓
VERIFY
  ↓
AUTHORIZE
  ↓
READ BACK
  ↓
COMMIT / ABORT / RECOVER
```

For the business audience, keep research technology names behind the implementation boundary. The jury should see the result and the assurance mechanism rather than a buzzword inventory.

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

The recovered material explicitly says that a live CALL-E call must be a central element of the demo, not an optional add-on.

## 4. Judge-oriented framing recovered from the material

The material distinguishes the four Stage Two perspectives:

| Perspective | What the demo must answer |
|---|---|
| Strategy / technology / business | Could this be a real product rather than a hackathon experiment? |
| Market / GTM / commercial value | Who pays for it and why? |
| Product / UX / actual CALL-E use | Does the project genuinely use CALL-E's capabilities? |
| Adoption / use / scale | Can the pattern be deployed beyond one demo? |

The implementation should therefore optimize each subsequent change for **Impact + Idea + Technical Implementation + Product/Demo**, without sacrificing Stage One compliance.

## 5. Repository separation — do not confuse the two CALL-E repositories

### `CALL-E-AI/call-e-integrations`

Use as the integration/configuration/reference repository for CALL-E SDK/API/MCP/CLI/Skill patterns.

It is **not** the repository where the hackathon project contribution is submitted.

### `CALL-E-AI/awesome-phone-call-agents`

This is the submission/community-contribution target identified by the recovered material. The required flow is:

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
- Explicitly authorized live CALL-E workflow that targets current `main` and performs one transaction.

### Not complete or not externally verified

These remain open until independently evidenced:

- [ ] Confirm the Devpost account is registered/qualified for the hackathon.
- [ ] Submit the Additional Calls Request Form before its 06:00 CEST deadline if additional allocation is still desired.
- [ ] Confirm current CALL-E credits/allowance available for the final live test; do not assume additional 200 calls were granted.
- [ ] Perform/retain evidence for the final authorized live CALL-E test on the current `main` build if the previously recorded live test is not accepted as final evidence.
- [ ] Produce the final public demo video and ensure it is **under 3 minutes**.
- [ ] Publish the demo video to YouTube or Vimeo and retain the public URL.
- [ ] Create/use the contributor fork of `CALLE-AI/awesome-phone-call-agents`.
- [ ] Push the prepared community contribution to that fork.
- [ ] Open the actual upstream Pull Request.
- [ ] Record the actual PR URL in the submission package.
- [ ] Complete the Devpost project description, problem, solution, architecture, CALL-E account email, PR URL, video URL, optional demo URL, and test/live evidence fields.
- [ ] Complete the final Devpost submission and verify that it is actually submitted, not merely drafted.
- [ ] Perform a final clean-checkout verification from the exact submitted commit.
- [ ] Preserve final CI/test evidence and the final commit SHA used for submission.

## 7. Important safety boundary

The recovered material calls for advanced components such as Titans, JEPA, HDC, SNN, DGM, Digital Genotype, mutation loops and RSI. These must remain implementation adapters/roadmap layers unless a concrete, testable runtime implementation exists.

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

This register distinguishes three states:

- **IMPLEMENTED** — represented by code/tests/docs in this repository.
- **VERIFIED** — backed by an actual reproducible run or external artifact.
- **OPEN** — requires an external action, additional evidence, or a final verification.

No external PR, Devpost submission, video publication, additional-call allocation or live CALL-E execution should be marked complete without the corresponding real artifact/evidence.
