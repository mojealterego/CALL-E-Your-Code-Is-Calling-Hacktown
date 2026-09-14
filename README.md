# AegisFleet — Incident Voice Command

**Governed autonomous phone coordination for logistics exceptions, built with CALL-E.**

AegisFleet turns a logistics incident into a controlled phone workflow: validate the incident, reserve a stable operation identity, execute a bounded phone task, validate the structured outcome, require evidence for automatic resolution, and escalate whenever the evidence is insufficient.

> **Safety default:** `npm run demo` is fully local. It makes zero network requests and places zero phone calls.

## Core thesis

A voice agent is only useful to an enterprise when its output can be bounded and connected safely to the next business action. AegisFleet therefore focuses on the control plane around the phone call rather than on conversation quality alone.

```text
incident → policy gate → idempotency reservation → CALL-E / simulator
→ strict outcome validation → evidence + confidence gate
→ resolved / escalated → audit ledger → reflexion → bitemporal memory
```

## Implemented

- Explicit incident state machine and E.164/purpose-bounded policy gate.
- Deterministic dry-run simulator and CALL-E server SDK adapter.
- Closed structured outcome schema with explicit `unknown` states.
- Idempotency before provider I/O, evidence/confidence resolution gate and human escalation.
- Replay-aware webhooks and hash-linked audit ledger.
- Bitemporal decision memory with point-in-time reconstruction.
- Decision Intelligence, bounded Reflexion, retrospective correction and deterministic Synthetic Red-Team coverage.
- Bounded cognitive control layer: working memory, HDC/holographic associative indexing, Shimi-style semantic retrieval with temporal decay, counterfactual causal analysis, capability-scoped MCP gateway boundary, Pareto selection, adaptive load shedding, prompt compression, hard-negative mining, trust regulation and gated mutation/evolution evaluation.
- Automated regression tests and GitHub Actions CI.

## Cognitive control plane

`src/cognitive-modules.ts` contains deterministic bounded control primitives corresponding to the requested architecture directions. They are deliberately separated from the phone executor and cannot authorize calls or mutate production code.

The mutation/evolution protocol is proposal-only: sandbox → red-team → formal/property check → benchmark → shadow → approval → release/rollback. No generated candidate can directly overwrite source, secrets, policy, audit history or the live phone executor.

CoALA, JEPA, Graph of Thought, R2/R3 reasoning, SNN, SEGPA, OESI, CEV, ImandraX, full AlphaEvolve/DGM code synthesis, digital genotype, autonomous RSI, AB-MCTS and proprietary DeepMind architectures remain research tracks requiring actual model implementations and reproducible evaluation.

See [`docs/cognitive-control-plane.md`](docs/cognitive-control-plane.md).

## Quick start

```bash
npm install
npm run demo
npm test
npm run typecheck
npm run verify:final
```

## Live CALL-E execution

The repository includes a manual `LIVE CALL-E Test` workflow. It requires explicit confirmation, validates `CALLE_API_KEY` and `AEGIS_LIVE_PHONE`, performs a no-call authentication preflight, then executes exactly one live transaction against the current `main` revision.

Live mode is explicit and does not silently downgrade to dry-run.

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

Automatic resolution requires acceptance = `yes`, non-empty ETA, escalation = `none`, non-empty evidence and confidence = `high`. Otherwise the incident becomes `escalated`.

## Architecture / evaluation / submission

See [`docs/architecture.md`](docs/architecture.md), [`docs/cognitive-control-plane.md`](docs/cognitive-control-plane.md), [`docs/evaluation.md`](docs/evaluation.md), [`docs/security.md`](docs/security.md), [`docs/demo-script.md`](docs/demo-script.md), [`docs/hackathon-checklist.md`](docs/hackathon-checklist.md) and [`SUBMISSION.md`](SUBMISSION.md).

## Community contribution package

A provider-neutral reusable Agent Skill is prepared at `docs/community-contribution/voice-transaction-coordinator/` and mirrored under `skills/voice-transaction-coordinator/` for installable-skill structure.

## Repository layout

```text
.
├── .github/workflows/ci.yml
├── .github/workflows/live-call.yml
├── docs/
│   ├── architecture.md
│   ├── cognitive-control-plane.md
│   ├── community-contribution/voice-transaction-coordinator/
│   ├── demo-script.md
│   ├── evaluation.md
│   ├── grant-proposal.md
│   ├── hackathon-checklist.md
│   └── security.md
├── skills/voice-transaction-coordinator/
├── src/
│   ├── bitemporal-memory.ts
│   ├── cognitive-modules.ts
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
│   ├── cognitive-modules.test.ts
│   ├── decision-intelligence.test.ts
│   ├── ledger.test.ts
│   ├── orchestrator.test.ts
│   ├── policy.test.ts
│   ├── red-team.test.ts
│   ├── reflexion.test.ts
│   └── validation.test.ts
├── .env.example
├── .gitignore
├── SUBMISSION.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Production hardening backlog

- transactional persistent idempotency store;
- durable audit storage and verification tooling;
- authenticated provider webhook ingestion;
- RBAC and organization-level policy configuration;
- secrets management and rotation;
- retention/deletion and jurisdiction-specific privacy controls;
- operator console and global kill switch;
- TMS/ERP write-back connectors;
- load, fault-injection and red-team evaluation at scale;
- durable bitemporal storage and indexed bitemporal graph queries;
- evaluated learned reasoning/memory models behind capability-scoped interfaces.

## Work log

### 2026-09-14

- Implemented and tested bounded cognitive-control primitives requested for the architecture.
- Fixed strict TypeScript indexed-access validation exposed by CI.
- Corrected the live CALL-E workflow to execute current `main` rather than the historical feature branch.
- Persisted the implementation and boundaries in `README.md` and `docs/cognitive-control-plane.md`.
- Kept DGM/AlphaEvolve/RSI mutation proposal-only: no autonomous source mutation, production hot-swap, credential access or phone-executor self-modification.

## License

MIT
