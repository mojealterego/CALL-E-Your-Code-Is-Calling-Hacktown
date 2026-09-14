# AegisFleet — Incident Voice Command

Governed autonomous phone coordination for logistics exceptions, built with CALL-E.

The repository implements a bounded control plane around phone execution: policy → idempotency → CALL-E/simulator → strict outcome validation → evidence/confidence gate → resolve/escalate → audit → Reflexion → bitemporal memory.

## Core principle

> **CALL-E gives the agent a voice. AegisFleet gives that voice accountability.**

The system deliberately separates conversational claims from authoritative business state:

> **Evidence ≠ inference ≠ verified fact.**

## Real-World Assurance Fabric

`src/assurance-fabric.ts` extends the execution boundary with Claim Ledger, Evidence Graph, Monitorability Score, trajectory security, post-call compound reasoning, explicit epistemic states, stale-state protection, Side-Effect Conservation Invariant and a versioned Conversation Contract.

Conversational claims remain `UNVERIFIED` until transaction gates justify commitment. `UNKNOWN`, `UNVERIFIED`, `CONTRADICTED` and `STALE` are never silently collapsed into success.

`runIncident()` creates the Conversation Contract before execution and returns a post-call assurance bundle containing claims, provenance graph, monitorability and trajectory-security results. Compound reasoning is post-call only; agreement is a confidence signal, not proof, and disagreement forces recovery.

Prepared state is versioned against authoritative readback. A mismatch produces `STALE → RECOVER`. Uncertainty about whether an external call happened is governed by the Side-Effect Conservation Invariant: one logical transaction permits zero or one external execution, never a blind duplicate retry.

Full design: `docs/real-world-assurance-fabric.md`. Regression suite: `tests/assurance-fabric.test.ts`.

## Architecture and demo assets

- `ARCHITECTURE.md` — canonical runtime architecture, Mermaid flow, provider boundary, evidence model, idempotency, webhook flow and production invariants.
- `PITCH_SCRIPT.md` — complete sub-3-minute demonstration script with shots, dialogue, narration and negative-path proof.
- `SUBMISSION.md` — submission narrative and external-artifact requirements.
- `docs/demo-script.md` — detailed existing shot list.
- `docs/recovered-material-gap-register.md` — recovered requirements and explicit implementation/external-evidence gaps.

## 69-page architecture source ledger

The supplied 69-page material and preceding design discussion are consolidated into `docs/69-page-analysis-ledger.md`. It is the requirements source of truth for recovered architecture decisions: Claim Ledger, Evidence Graph, monitorability, epistemic `UNKNOWN`, stale-state protection, side-effect conservation, compound reasoning placement, Conversation Contract, the complete 34–69 capability series, appointment branching and competition positioning.

The ledger intentionally separates **DESIGN RECOVERED**, **IMPLEMENTED**, **RUNTIME-INTEGRATED**, **TESTED** and **VERIFIED**. This prevents a capability name or research adapter from being mistaken for a production-authoritative implementation.

## Implemented cognitive control

`src/cognitive-modules.ts` provides bounded deterministic primitives for working memory, HDC/holographic associative indexing, Shimi-style semantic retrieval with temporal decay, counterfactual causal analysis, capability-scoped MCP gateway boundaries, Pareto selection, load shedding, prompt compression, hard-negative mining, trust regulation and a gated mutation/evolution evaluation protocol.

`src/advanced-cognitive-stack.ts` contains the bounded research-capability layer: CoALA memory control, G-memory, bitemporal graph memory, HDC, RAG 2.0, Graph of Thought, digital genotype, mutation engine/loop, AlphaEvolve/DGM candidate evolution, RSI with rollback, R2/R3-style reasoning primitives, SNN spike encoding, JEPA-style predictive-state scoring, Decision/AB-MCTS, counterfactual scoring, adversarial gating, CEV, GCP authorization, Gödel/ImandraX/SEGPA invariant guards, OESI evidence gating, Agent Devel, self-correction, offline replay/digital sleep, synaptic pruning, curriculum learning, temporal decay, anti-reward-hacking, schema alignment, modality switching, semantic caching, load shedding, resource donation, chaos planning, Pareto selection, retrospective correction, point-in-time recovery, procedural memory and Digital Nexus introspection/modulation.

`src/research-adapters.ts` adds bounded interfaces for latent-space messaging, cross-examination, firewalling, bounded infinite-horizon planning, controlled noise, legacy bridging, pre-trained knowledge retention, offline fallback, few-shot tool plans, meta-architecture candidates, zero-shot domain adaptation, MAML-style adaptation metrics, model distillation, Bayesian A/B, adaptive trust, multimodal fusion, predictive fetch, backoff/jitter primitives, latency budgets, asynchronous concurrency, fuzzy clarification, DAG planning, HNSW-style candidate selection and zero-trust authorization.

### Meta-Architect capabilities 34–69

`src/meta-architect-34-69.ts` is the governed implementation layer for the requested evolution, causal, memory-consolidation, meta-learning, homeostasis, recursive-state, semantic-cache, latent-message, cross-examination, constitutional-refusal, temporal-decay, resource-sharing, compression, multimodal, load-shedding, domain-adaptation, handshake, chaos, Pareto, bounded-horizon, noise, legacy, retention, offline-fallback, curriculum, defragmentation, schema-alignment, modality-switching, Bayesian A/B, trust, few-shot-tool-plan and meta-architecture capabilities.

`governedRSI()` enforces `sandbox → redTeam → formal → benchmark → shadow → approval` and returns `release` only when every gate passes and net fitness is positive. Otherwise it returns `rollback`. Candidate/tool/architecture generation is non-executable and approval-bound.

### Transcendence capabilities 70–88 and 89–99

`src/asi-transcendence-stack.ts` and `src/transcendence-89-99.ts` contain bounded, deterministic contracts for the recovered advanced capability series. Hardware dispatch, autonomous source mutation, historical rewriting, proprietary-system reproduction and unrestricted self-modification are explicitly outside the authority boundary.

## Rust SNN + Zenoh fast path

`rust/snn-zenoh/` adds an actual Rust leaky-integrate-and-fire spiking-neural-network fast path. Each inference frame emits explicit spike events and carries an enforced **1 ms target budget** with measured elapsed time. Optional feature `zenoh-transport` adds Zenoh 1.x publication of serialized SNN frames.

Zenoh is isolated as transport: it cannot bypass AegisFleet policy, evidence, confidence or idempotency controls.

## ImandraX-style formal reasoning + MARS

`src/imandrax-mars.ts` adds a deterministic formal-proof request boundary, fail-closed invariant gate and bounded MARS metacognitive reflection cycle. The boundary is adapter-shaped and does not claim to reproduce proprietary ImandraX.

## Safety default

`npm run demo` is deterministic and performs zero provider or phone calls. Automatic resolution requires acceptance=`yes`, non-empty ETA, escalation=`none`, non-empty evidence and confidence=`high`.

## Live CALL-E

The manual `LIVE CALL-E Test` workflow requires explicit authorization, validates secrets, performs a no-call authentication preflight and executes exactly one live transaction against the **current `main`** revision.

The controlled live run executed on 2026-09-14 passed all 21 test files / 108 tests and the authentication preflight, but CALL-E returned **Insufficient CALL-E balance** before placing an outbound call. The application correctly entered `recovering` with `callsPlaced=0`. This is not represented as a successful live demo.

## Verification

```bash
npm install
npm run verify:final
npm run verify:meta
npm run verify:asi
npm run verify:transcendence
npm run verify:assurance
```

Rust fast-path verification:

```bash
cd rust/snn-zenoh
cargo test
cargo run
cargo check --features zenoh-transport
```

## Submission

The official Devpost rules specify a deadline of **14 September 2026, 23:45 SGT**, equivalent to **17:45 CEST in Poland**. That deadline has passed as of the current repository audit. Therefore this repository does **not** fabricate a claim of a successful post-deadline Devpost submission.

The required community contribution target remains `CALLE-AI/awesome-phone-call-agents`. No upstream PR is claimed without an actual fork, push and PR URL.

## Current engineering state

The repository is in a reproducible, testable state, but external proof artifacts remain distinct from code completion. In particular, a successful live CALL-E call, public demo video and actual community PR must only be marked complete when their real artifacts exist.

See `docs/work-log-2026-09-14.md` and `docs/recovered-material-gap-register.md` for the complete engineering and evidence ledger.

## License

MIT
