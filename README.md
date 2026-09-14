# AegisFleet — Incident Voice Command

Governed autonomous phone coordination for logistics exceptions, built with CALL-E.

The repository implements a bounded control plane around phone execution: policy → idempotency → CALL-E/simulator → strict outcome validation → evidence/confidence gate → resolve/escalate → audit → Reflexion → bitemporal memory.

## Implemented cognitive control

`src/cognitive-modules.ts` provides bounded deterministic primitives for working memory, HDC/holographic associative indexing, Shimi-style semantic retrieval with temporal decay, counterfactual causal analysis, capability-scoped MCP gateway boundaries, Pareto selection, load shedding, prompt compression, hard-negative mining, trust regulation and a gated mutation/evolution evaluation protocol.

The mutation protocol is proposal-only: sandbox → red-team → formal/property check → benchmark → shadow → approval → release/rollback. It cannot overwrite source, secrets, policy, audit history or the phone executor.

Research-track names such as CoALA, JEPA, Graph of Thought, R2/R3, SNN, SEGPA, OESI, CEV, ImandraX, full AlphaEvolve/DGM, digital genotype, autonomous RSI, AB-MCTS and proprietary DeepMind architectures are not falsely claimed as implemented learned models.

## Safety default

`npm run demo` is deterministic and performs zero provider or phone calls. Automatic resolution requires acceptance=`yes`, non-empty ETA, escalation=`none`, non-empty evidence and confidence=`high`.

## Live CALL-E

The manual `LIVE CALL-E Test` workflow requires explicit authorization, validates secrets, performs a no-call authentication preflight and executes exactly one live transaction against current `main`.

## Verification

```bash
npm install
npm run verify:final
```

## Submission

See `docs/demo-script.md`, `docs/hackathon-checklist.md` and `SUBMISSION.md`. External submission artifacts are never fabricated.

## Work log — 2026-09-14

- Implemented and tested bounded cognitive-control primitives requested for the architecture.
- Fixed strict TypeScript indexed-access validation exposed by CI.
- Corrected the live CALL-E workflow to execute current `main` instead of the historical feature branch.
- Persisted the implementation and safety boundaries in repository documentation.

## License

MIT
