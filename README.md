# AegisFleet — Incident Voice Command

**Governed autonomous phone coordination for logistics exceptions, built with CALL-E.**

AegisFleet turns a logistics incident into a controlled phone workflow: validate the incident, reserve a stable operation identity, execute a bounded phone task, validate the structured outcome, require evidence for automatic resolution, and escalate whenever the evidence is insufficient.

> **Safety default:** `npm run demo` is fully local. It makes zero network requests and places zero phone calls.

## Core thesis

A voice agent is only useful to an enterprise when its output can be bounded and connected safely to the next business action. AegisFleet therefore focuses on the control plane around the phone call rather than on conversation quality alone.

```text
incident
  ↓
policy gate
  ↓
idempotency reservation
  ↓
CALL-E / deterministic simulator
  ↓
strict outcome validation
  ↓
evidence + confidence gate
  ├── resolved → ERP-ready decision
  └── escalated → human action
  ↓
audit ledger
  ↓
reflexion / retrospective finding
  ↓
bitemporal episodic memory
```

## Implemented

- TypeScript domain model and explicit incident state machine.
- Policy gate with E.164 validation, purpose-bounded goals, live-mode opt-in and fixture-number protection.
- Deterministic dry-run simulator that follows the same outcome-validation path as live execution.
- CALL-E server SDK adapter with strict result extraction and validation.
- JSON Schema contract with `additionalProperties: false` and explicit `unknown` states.
- Application-level idempotency reservation before provider I/O.
- Evidence-backed automatic resolution; uncertainty never becomes an implicit success/failure.
- Human escalation on policy rejection, execution errors, insufficient evidence, low confidence or explicit escalation.
- Replay-aware webhook contract and event-ID deduplication.
- Hash-linked audit records for tamper-evident sequencing inside the prototype ledger.
- Bitemporal decision memory with valid-time / recording-time separation and point-in-time reconstruction.
- **Decision Intelligence layer:** deterministic assessment of policy, evidence, confidence, latency and cost, plus bounded baseline-versus-candidate comparison for shadow evaluation.
- **Bounded Reflexion layer:** converts policy, execution, validation and uncertain outcomes into explicit retrospective findings and correction guidance; findings are always marked `safeToAutoResolve: false`.
- **Orchestrator integration:** every non-reused execution stores its Reflexion finding in a bitemporal episodic memory store; terminal idempotent reuse does not create a duplicate finding.
- **Deterministic Synthetic Red-Team harness:** adversarial cases cover policy rejection, missing evidence, low confidence, malformed outcomes, duplicate operations, budget breaches, contradictory outcomes and replayed events. Every case must preserve escalation safety.
- Automated regression tests and GitHub Actions CI.
- Grant proposal, architecture, security model and judge-ready three-minute demo script.

## Cognitive control plane

The repository now includes a bounded cognitive architecture rather than a collection of unverified AI buzzwords. `BitemporalMemoryStore` provides working/episodic/procedural memory categories and point-in-time reconstruction. `assessDecision()` provides an explicit decision boundary around policy, evidence, confidence and operational metrics. `reflectOnExecution()` produces retrospective findings without granting them authority to resolve an incident. `runSyntheticRedTeam()` exercises adversarial safety invariants. The orchestrator now persists each non-reused Reflexion finding as an episodic bitemporal record.

See [`docs/cognitive-control-plane.md`](docs/cognitive-control-plane.md) for the bilingual architecture mapping. CoALA, JEPA, HDC/holographic memory, Graph of Thought, R2/R3 reasoning, AlphaEvolve/DGM mutation loops, RSI, AB-MCTS, SNN, SEGPA, OESI, CEV, ImandraX and an MCP Gateway are explicitly treated as research-track extensions until they have concrete implementations and reproducible evaluation. The project does not claim capabilities that are not present in code.

## Quick start

```bash
npm install
npm run demo
npm test
npm run typecheck
```

The demo creates a synthetic A4 closure incident and shows the complete governed lifecycle without calling CALL-E or a telephone recipient.

## Live CALL-E execution

1. Copy `.env.example` to `.env`.
2. Add a valid `CALLE_API_KEY`.
3. Set a provisioned test number with `AEGIS_LIVE_PHONE`.
4. Run `npm run live`.

Live mode is intentionally explicit and does not silently downgrade to dry-run. Invalid configuration fails before provider I/O.

## Result contract

```json
{
  "route_acceptance": "yes",
  "eta_update_time": "16:40",
  "escalation_needed": "none",
  "evidence_summary": "Driver confirmed the diversion and stated the revised ETA is 16:40.",
  "confidence": "high"
}
```

Automatic resolution requires all five conditions: acceptance = `yes`, non-empty ETA, escalation = `none`, non-empty evidence, and confidence = `high`. Otherwise the incident becomes `escalated`.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the runtime model and CALL-E integration boundary.

## Security

See [`docs/security.md`](docs/security.md). The prototype deliberately does not claim provider signature verification, persistent enterprise storage, RBAC, or production-grade webhook infrastructure unless those controls are actually configured.

## Evaluation

See [`docs/evaluation.md`](docs/evaluation.md) for the deterministic validation matrix, safety metrics and production-pilot measurement plan. The repository distinguishes test evidence from future production measurements and does not fabricate performance numbers.

## Demo

See [`docs/demo-script.md`](docs/demo-script.md). The intended recording is under three minutes and demonstrates the safety gate, structured outcome contract, idempotency behavior and impact thesis.

## Repository layout

```text
.
├── .github/workflows/ci.yml
├── docs/
│   ├── architecture.md
│   ├── cognitive-control-plane.md
│   ├── demo-script.md
│   ├── evaluation.md
│   ├── grant-proposal.md
│   └── security.md
├── src/
│   ├── bitemporal-memory.ts
│   ├── calle.ts
│   ├── cli.ts
│   ├── decision-intelligence.ts
│   ├── domain.ts
│   ├── fsm.ts
│   ├── ledger.ts
│   ├── orchestrator.ts
│   ├── policy.ts
│   ├── red-team.ts
│   ├── reflexion.ts
│   ├── simulator.ts
│   ├── validation.ts
│   └── webhook.ts
├── tests/
│   ├── bitemporal-memory.test.ts
│   ├── decision-intelligence.test.ts
│   ├── ledger.test.ts
│   ├── orchestrator.test.ts
│   ├── policy.test.ts
│   ├── red-team.test.ts
│   ├── reflexion.test.ts
│   └── validation.test.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vitest.config.ts

## CALL-E integration note

The project treats CALL-E as the phone-execution provider. The current prototype uses its TypeScript server SDK for backend-controlled execution. The documented MCP lifecycle is `plan_call → run_call → get_call_run`; the repository keeps provider-specific concerns behind `src/calle.ts` so the business policy remains independent of the transport mechanism.

## Submission discipline

The repository distinguishes between **implemented evidence** and **deployment/submission artifacts**. It does not fabricate a deployed URL, live credentials, a completed contribution PR, or a recorded video. Those are final environment-specific steps.

For the community contribution requirement, the intended target is `CALLE-AI/awesome-phone-call-agents`. A contribution PR should be opened from a dedicated branch after the final local/CI verification and should link back to this repository.

## Production hardening backlog

The prototype intentionally isolates the remaining enterprise work:

- transactional persistent idempotency store;
- durable audit storage and verification tooling;
- authenticated provider webhook ingestion;
- RBAC and organization-level policy configuration;
- secrets management and rotation;
- retention/deletion policies and jurisdiction-specific privacy controls;
- operator console and global kill switch;
- TMS/ERP write-back connectors;
- load, fault-injection and red-team evaluation at scale;
- durable bitemporal storage and indexed bitemporal graph queries;
- evaluated reasoning/memory models behind capability-scoped interfaces rather than directly in the phone executor.

## License

MIT
