# Advanced Cognitive Capability Matrix

This matrix records the requested concepts and the bounded implementation status in AegisFleet. Research names are used as architectural references, not as claims of reproducing proprietary models or papers.

| Requested capability | Bounded implementation |
|---|---|
| Bitemporal store / bitemporal | `src/bitemporal-memory.ts` |
| Bitemporal graph memory | `BitemporalGraphMemory` |
| CoALA / CoALA memory | `CoALAMemoryController` with working, episodic, procedural and semantic layers |
| G-memory | `GMemory` graph nodes/edges |
| Holographic memory / HDC | `HolographicMemory` plus `hdcEncode` / `hdcSimilarity` |
| Shimi index | `ShimiIndex` |
| MCP gateway | `McpGateway` scoped capability registry |
| AlphaEvolve | `alphaEvolve` gated candidate generation |
| DGM engine / DGM | digital genotype + mutation engine + gated evolution candidate |
| Digital genotype | `digitalGenotype` / `Genotype` |
| Mutation loop / Mutation Engine | `mutationEngine` / `mutationLoop` |
| RSI | explicit `RSIStage` pipeline with rollback |
| R2 reasoning | bounded `r2Reasoning` |
| R3 Titans reasoning | bounded `r3TitansReasoning` |
| Reasoning | deterministic premise aggregation/scoring primitives |
| Reflexion loop | `src/reflexion.ts` and orchestrator integration |
| SNN | `snnEncode` spike-event representation |
| Decision / Decision Cycle | `decisionCycle` and `DecisionOption` controls |
| GoT / Graph of Thought | `GraphOfThought` |
| JEPA | `jepaPredict` bounded predictive-state proxy |
| Adversarial gating | `adversarialGate` and synthetic red team |
| CEV engine | `CEV` constitutional evaluation |
| GCP | `GovernedCognitivePlane` policy boundary |
| Gödel guard | `godelGuard` invariant checker |
| OESI | evidence/confidence/contradiction gate |
| SEGPA | formal invariant gate alias |
| Synthetic red team | `src/red-team.ts` |
| RAG 2.0 | `RAG2` retrieve + temporal weighting + grounding |
| ImandraX | `imandraXGuard` invariant gate abstraction |
| Episodic memory | bitemporal Reflexion findings + CoALA episodic layer |
| Working memory | `WorkingMemory` bounded capacity + TTL |
| Long-term memory | bitemporal episodic/procedural/semantic storage abstractions |
| Procedural memory | `ProceduralMemoryStore` |
| Retrospective Correction | `retrospectiveCorrection` |
| Point-in-time recovery | `pointInTimeRecovery` + bitemporal stores |
| Counterfactual reasoning / causal inference | `CounterfactualGraph` and `counterfactualScore` |
| Cognitive Modulation | `cognitiveModulation` and `DigitalNexusCore.modulate` |
| Digital Nexus Core | `DigitalNexusCore` introspection/state boundary |
| Agent Devel | `agentDevel` gated development result |
| Self Correction | `safeSelfCorrection` |
| AB-MCTS | bounded `abMcts` decision selection |
| Offline replay / digital sleep | `offlineReplay` / `digitalSleep` |
| Synaptic pruning | `synapticPrune` |
| Meta-learning / curriculum | `curriculumDifficulty` |
| Temporal decay | `temporalKnowledgeWeight` and existing `temporalDecay` |
| Anti-reward hacking | `antiRewardHacking` |
| Neurosymbolic integration | formal/constitutional gate composition |
| Recursive state representation | `DigitalNexusCore.introspect` |
| Semantic caching | `semanticCacheKey` |
| Cross-examination | adversarial gate interface; provider-independent |
| Constitutional refusal | `constitutionalEvaluate` |
| Resource donation | `resourceDonate` |
| Token pruning / prompt compression | `promptPrune` and existing `compressPrompt` |
| Hard-negative mining | `hardNegativeMining` and existing `hardNegatives` |
| Multimodal fusion boundary | `modalitySwitch` |
| Adaptive load shedding | `dynamicLoadShedding` and existing `shedLoad` |
| Zero-shot adaptation | provider/model-neutral interfaces; no hidden weight mutation |
| Cross-system handshakes | `crossSystemHandshake` |
| Chaos engineering | deterministic `chaosScenario` planning primitive; no destructive production execution |
| Vector topology | HDC/semantic-index abstractions |
| Automated firewalling | policy/adversarial gate boundary; no deceptive external behavior |
| Pareto optimization | `paretoSelect` and existing `paretoFront` |
| Infinite-horizon planning | bounded decision search; no unbounded simulation |
| Controlled noise | research-track; no stochastic production mutation enabled |
| Legacy bridging | provider-neutral adapter boundary |
| Pre-trained retention | research-track; no model weight training in this repo |
| Offline fallback | deterministic local demo and provider boundary |
| A/B testing | `abTest` |
| Graceful degradation of trust | `trustGate` + existing trust adjustment |
| Few-shot tool generation | research-track; no arbitrary code execution enabled |
| Meta-architecture generation | bounded genotype/candidate representation only |
| Schema alignment | `schemaAlign` |
| Dynamic modality switching | `modalitySwitch` |
| Data-driven decisions | `DecisionOption`, metrics and bounded selectors |
| Negotiation / conflict resolution | bounded decision/transaction control layer; no unconstrained negotiation authority |
| DeepMind / DeepMind research concepts | research references only; no claim of proprietary DeepMind implementation |

## Safety boundary

The evolutionary stack cannot authorize a live phone transaction. Candidate generation, mutation, sandbox/red-team/formal checks, benchmark comparison, shadow evaluation and approval are separate from the operational policy gate. A research abstraction never bypasses the authoritative incident policy, evidence, confidence or idempotency controls.
