# AegisFleet — Incident Voice Command

Governed autonomous phone coordination for logistics exceptions, built with CALL-E.

The repository implements a bounded control plane around phone execution: policy → idempotency → CALL-E/simulator → strict outcome validation → evidence/confidence gate → resolve/escalate → audit → Reflexion → bitemporal memory.

## Implemented cognitive control

`src/cognitive-modules.ts` provides bounded deterministic primitives for working memory, HDC/holographic associative indexing, Shimi-style semantic retrieval with temporal decay, counterfactual causal analysis, capability-scoped MCP gateway boundaries, Pareto selection, load shedding, prompt compression, hard-negative mining, trust regulation and a gated mutation/evolution evaluation protocol.

`src/advanced-cognitive-stack.ts` contains the requested bounded research-capability layer: CoALA memory control, G-memory, bitemporal graph memory, HDC, RAG 2.0, Graph of Thought, digital genotype, mutation engine/loop, AlphaEvolve/DGM candidate evolution, RSI with rollback, R2/R3-style reasoning primitives, SNN spike encoding, JEPA-style predictive-state scoring, Decision/AB-MCTS, counterfactual scoring, adversarial gating, CEV, GCP authorization, Gödel/ImandraX/SEGPA invariant guards, OESI evidence gating, Agent Devel, self-correction, offline replay/digital sleep, synaptic pruning, curriculum learning, temporal decay, anti-reward-hacking, schema alignment, modality switching, semantic caching, load shedding, resource donation, chaos planning, Pareto selection, retrospective correction, point-in-time recovery, procedural memory and Digital Nexus introspection/modulation.

`src/research-adapters.ts` adds bounded interfaces for latent-space messaging, cross-examination, firewalling, bounded infinite-horizon planning, controlled noise, legacy bridging, pre-trained knowledge retention, offline fallback, few-shot tool plans, meta-architecture candidates, zero-shot domain adaptation, MAML-style adaptation metrics, model distillation, Bayesian A/B, adaptive trust, multimodal fusion, predictive fetch, backoff/jitter primitives, latency budgets, asynchronous concurrency, fuzzy clarification, DAG planning, HNSW-style candidate selection and zero-trust authorization.

### Meta-Architect capabilities 34–69

`src/meta-architect-34-69.ts` is the dedicated governed implementation layer for the requested evolution, causal, memory-consolidation, meta-learning, homeostasis, recursive-state, semantic-cache, latent-message, cross-examination, constitutional-refusal, temporal-decay, resource-sharing, compression, multimodal, load-shedding, domain-adaptation, handshake, chaos, Pareto, bounded-horizon, noise, legacy, retention, offline-fallback, curriculum, defragmentation, schema-alignment, modality-switching, Bayesian A/B, trust, few-shot-tool-plan and meta-architecture capabilities.

`governedRSI()` enforces `sandbox → redTeam → formal → benchmark → shadow → approval` and returns `release` only when every gate passes and net fitness is positive. Otherwise it returns `rollback`. Candidate/tool/architecture generation is non-executable and approval-bound.

Full mapping: `docs/meta-architect-34-69.md`. Dedicated regression suite: `tests/meta-architect-34-69.test.ts`.

### ASI Transcendence capabilities 70–88

`src/asi-transcendence-stack.ts` adds bounded contracts for Active Inference/Free Energy, TDA concept-manifold analysis, Gödelian gating, polysemantic feature attribution, semantic relation propagation, fractal swarm instantiation, autopoietic boundaries, cross-modal transfer, ZK-style commitment verification, ontological annealing, anticipatory future-memory records, HDC/VSA binding/bundling, QASM compilation boundaries, causal-emergence macro-agents, nested world simulation, hardware-target IR, NARS belief ranking, CEV predicates and temporal inversion correction.

These are deliberately bounded: QPU/FPGA dispatch, zk-SNARK proving, autonomous weight/source mutation and historical rewriting are not silently performed. Hardware changes always require human approval. Future-memory rendering is a bounded scenario cache, not precognition.

Full mapping: `docs/asi-transcendence-70-88.md`. Dedicated regression suite: `tests/asi-transcendence-stack.test.ts`.

### Transcendence capabilities 89–99

`src/transcendence-89-99.ts` adds bounded contracts for Synthetic Category Theory (`objects → morphisms → functor mapping`), multi-valued/perspectival epistemic logic, contradiction-isolating epistemic defragmentation, bounded DGM swarm branching/validated merge, non-executable hardware/software transpilation targets, formal-constraint + adversarial mutation approval, substrate latency/energy/thermal optimization, quantum-classical planning boundaries, energy-aware gating, constitutional alignment integrity checks and epistemic humility/rollback readiness.

Capabilities 92–98 deliberately cannot become a new production authority: branches are sandbox records, transpilation emits non-executable artifacts, quantum execution remains an explicit backend boundary, substrate selection is profile-based, and alignment is a gate rather than an objective rewrite. Capability 91 preserves contradictory evidence by isolation; capability 99 suppresses low-confidence decisions while reserving compute for monitoring and keeping rollback ready.

Full mapping: `docs/transcendence-89-99.md`. Dedicated regression suite: `tests/transcendence-89-99.test.ts`.

### Rust SNN + Zenoh fast path

`rust/snn-zenoh/` adds an actual Rust leaky-integrate-and-fire spiking-neural-network fast path. Each inference frame emits explicit spike events and carries an enforced **1 ms target budget** with measured elapsed time. Optional feature `zenoh-transport` adds Zenoh 1.x publication of serialized SNN frames. The budget is a gate/target, not a claim that arbitrary hardware or networks will always deliver sub-millisecond end-to-end latency.

Zenoh is isolated as transport: it cannot bypass AegisFleet policy, evidence, confidence or idempotency controls. The Rust SNN is therefore a low-latency signal layer, not an autonomous phone authority.

### ImandraX-style formal reasoning + MARS

`src/imandrax-mars.ts` adds a deterministic formal-proof request boundary, fail-closed invariant gate and bounded **MARS** metacognitive reflection cycle. MARS extracts principle-level failure rules and procedural steps in one bounded cycle; it cannot rewrite source, secrets, policies or the live phone executor. The ImandraX boundary is intentionally adapter-shaped: it does not claim to reproduce the proprietary ImandraX engine and can be replaced by an authorized external integration.

The mutation protocol remains proposal-only: observe → profile → hypothesis → generate → sandbox → red-team → formal check → benchmark → shadow → approval → release/rollback. It cannot overwrite source, secrets, policy, audit history or the phone executor. The advanced stack is deterministic TypeScript except for the explicitly isolated Rust SNN runtime; it does not claim to train JEPA/SNN/LLMs, reproduce proprietary DeepMind systems, or grant autonomous production self-modification.

The complete mapping is maintained in `docs/advanced-capability-matrix.md`.

## Meta-architecture operating skills

The control plane also encodes bounded operational skills for negotiation, data-driven decisions, conflict resolution, emotional-intelligence-aware human escalation, critical thinking/red teaming, delegation through contracts, provider/model adaptability, context-window optimization, strict input validation, backoff/rate-limit resilience, memory consolidation, asynchronous concurrency, latency budgeting, controlled exploration/noise, anomaly and concept-drift detection, predictive prefetching, zero-trust sandboxing, goal/reward governance, knowledge distillation, service discovery boundaries, webhook/long-running-job handling, confidence-based human fallback, preference/penalty learning boundaries, heuristic fast paths, schema enforcement, graceful degradation, fuzzy clarification, DAG planning, semantic clustering/routing, reasoning audit boundaries and global knowledge-graph construction. These are deterministic contracts and decision gates; they do not grant unrestricted autonomy or self-modification.

## Safety default

`npm run demo` is deterministic and performs zero provider or phone calls. Automatic resolution requires acceptance=`yes`, non-empty ETA, escalation=`none`, non-empty evidence and confidence=`high`.

## Live CALL-E

The manual `LIVE CALL-E Test` workflow requires explicit authorization, validates secrets, performs a no-call authentication preflight and executes exactly one live transaction against current `main`.

## Verification

```bash
npm install
npm run verify:final
npm run verify:meta
npm run verify:asi
npm run verify:transcendence
```

Rust fast-path verification:

```bash
cd rust/snn-zenoh
cargo test
cargo run
# optional transport compilation:
cargo check --features zenoh-transport
```

## Submission

See `docs/demo-script.md`, `docs/hackathon-checklist.md` and `SUBMISSION.md`. External submission artifacts are never fabricated.

## Work log — 2026-09-14

- Implemented and tested bounded cognitive-control primitives requested for the architecture.
- Added the advanced cognitive stack and capability matrix covering CoALA, G-memory, HDC/holographic memory, Shimi index, MCP/GCP boundaries, AlphaEvolve/DGM/genotype/mutation/RSI, R2/R3 reasoning, SNN, JEPA-style prediction, GoT, adversarial/constitutional/formal gates, RAG 2.0, AB-MCTS, offline replay/digital sleep, retrospective correction and point-in-time recovery.
- Added bounded research adapters for the remaining meta-architecture skills, including negotiation/data-driven decision contracts, resilience, adaptive routing, zero-trust boundaries and non-executable tool/architecture generation.
- Added the dedicated governed Meta-Architect 34–69 layer and regression suite, including a six-gate RSI release protocol with mandatory rollback on failed evidence.
- Added the ASI Transcendence 70–88 bounded layer and dedicated regression suite.
- Added the Transcendence 89–99 bounded layer and dedicated regression suite: category/functor mapping, multi-valued epistemic state, defragmentation, sandbox swarm merge, transpilation boundaries, formal/adversarial approval, substrate/energy gates, hybrid quantum planning, alignment integrity and epistemic humility.
- Added a Rust LIF SNN fast path with explicit 1 ms budget accounting and optional Zenoh 1.x transport.
- Added bounded ImandraX-style proof-request/invariant gating and a one-cycle MARS metacognitive reflection controller.
- Expanded regression coverage for previously unasserted R2/R3 reasoning, mutation loop, Agent Devel, Pareto, chaos, handshake and cognitive-modulation exports.
- Fixed strict TypeScript indexed-access validation exposed by CI.
- Corrected the live CALL-E workflow to execute current `main` instead of the historical feature branch.
- Persisted the implementation and safety boundaries in repository documentation.

## License

MIT