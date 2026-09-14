# AegisFleet — Incident Voice Command

Governed autonomous phone coordination for logistics exceptions, built with CALL-E.

The repository implements a bounded control plane around phone execution: policy → idempotency → CALL-E/simulator → strict outcome validation → evidence/confidence gate → resolve/escalate → audit → Reflexion → bitemporal memory.

## Implemented cognitive control

`src/cognitive-modules.ts` provides bounded deterministic primitives for working memory, HDC/holographic associative indexing, Shimi-style semantic retrieval with temporal decay, counterfactual causal analysis, capability-scoped MCP gateway boundaries, Pareto selection, load shedding, prompt compression, hard-negative mining, trust regulation and a gated mutation/evolution evaluation protocol.

`src/advanced-cognitive-stack.ts` contains the requested bounded research-capability layer: CoALA memory control, G-memory, bitemporal graph memory, HDC, RAG 2.0, Graph of Thought, digital genotype, mutation engine/loop, AlphaEvolve/DGM candidate evolution, RSI with rollback, R2/R3-style reasoning primitives, SNN spike encoding, JEPA-style predictive-state scoring, Decision/AB-MCTS, counterfactual scoring, adversarial gating, CEV, GCP authorization, Gödel/ImandraX/SEGPA invariant guards, OESI evidence gating, Agent Devel, self-correction, offline replay/digital sleep, synaptic pruning, curriculum learning, temporal decay, anti-reward-hacking, schema alignment, modality switching, semantic caching, load shedding, resource donation, chaos planning, Pareto selection, retrospective correction, point-in-time recovery, procedural memory and Digital Nexus introspection/modulation.

### Rust SNN + Zenoh fast path

`rust/snn-zenoh/` adds an actual Rust leaky-integrate-and-fire spiking-neural-network fast path. Each inference frame emits explicit spike events and carries an enforced **1 ms target budget** with measured elapsed time. Optional feature `zenoh-transport` adds Zenoh 1.x publication of serialized SNN frames. The budget is a gate/target, not a claim that arbitrary hardware or networks will always deliver sub-millisecond end-to-end latency.

Zenoh is isolated as transport: it cannot bypass AegisFleet policy, evidence, confidence or idempotency controls. The Rust SNN is therefore a low-latency signal layer, not an autonomous phone authority.

### ImandraX-style formal reasoning + MARS

`src/imandrax-mars.ts` adds a deterministic formal-proof request boundary, fail-closed invariant gate and bounded **MARS** metacognitive reflection cycle. MARS extracts principle-level failure rules and procedural steps in one bounded cycle; it cannot rewrite source, secrets, policies or the live phone executor. The ImandraX boundary is intentionally adapter-shaped: it does not claim to reproduce the proprietary ImandraX engine and can be replaced by an authorized external integration.

The mutation protocol remains proposal-only: observe → profile → hypothesis → generate → sandbox → red-team → formal check → benchmark → shadow → approval → release/rollback. It cannot overwrite source, secrets, policy, audit history or the phone executor. The advanced stack is deterministic TypeScript except for the explicitly isolated Rust SNN runtime; it does not claim to train JEPA/SNN/LLMs, reproduce proprietary DeepMind systems, or grant autonomous production self-modification.

The complete mapping is maintained in `docs/advanced-capability-matrix.md`.

## Safety default

`npm run demo` is deterministic and performs zero provider or phone calls. Automatic resolution requires acceptance=`yes`, non-empty ETA, escalation=`none`, non-empty evidence and confidence=`high`.

## Live CALL-E

The manual `LIVE CALL-E Test` workflow requires explicit authorization, validates secrets, performs a no-call authentication preflight and executes exactly one live transaction against current `main`.

## Verification

```bash
npm install
npm run verify:final
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
- Added a Rust LIF SNN fast path with explicit 1 ms budget accounting and optional Zenoh 1.x transport.
- Added bounded ImandraX-style proof-request/invariant gating and a one-cycle MARS metacognitive reflection controller.
- Fixed strict TypeScript indexed-access validation exposed by CI.
- Corrected the live CALL-E workflow to execute current `main` instead of the historical feature branch.
- Persisted the implementation and safety boundaries in repository documentation.

## License

MIT
