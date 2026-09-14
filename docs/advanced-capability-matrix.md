# Advanced Cognitive Capability Matrix

This matrix records the requested concepts and their bounded implementation status in AegisFleet. Research names are architectural references, not claims of reproducing proprietary models or papers.

| Requested capability | Bounded implementation |
|---|---|
| Bitemporal store / bitemporal | `src/bitemporal-memory.ts` |
| Bitemporal graph memory | `BitemporalGraphMemory` |
| CoALA / CoALA memory | `CoALAMemoryController` |
| G-memory | `GMemory` |
| Holographic memory / HDC | `HolographicMemory` + `hdcEncode` / `hdcSimilarity` |
| Shimi index | `ShimiIndex` |
| MCP gateway | `McpGateway` scoped capability registry |
| AlphaEvolve / DGM | gated genotype/candidate evolution |
| Digital genotype / mutation engine / mutation loop | `Genotype`, `digitalGenotype`, `mutationEngine`, `mutationLoop` |
| RSI | explicit stage pipeline with rollback |
| R2 / R3 Titans / reasoning | bounded deterministic premise composition and scoring |
| Reflexion loop | `src/reflexion.ts` + orchestrator integration |
| SNN | Rust LIF SNN in `rust/snn-zenoh`, explicit spikes + measured 1 ms budget status |
| Zenoh | optional Rust Zenoh 1.x transport; isolated from policy authority |
| 1 ms latency target | explicit 1,000 µs budget gate/measurement; no universal hardware/network guarantee |
| Decision / Decision Cycle / AB-MCTS | bounded decision metrics and selectors |
| GoT / Graph of Thought | `GraphOfThought` |
| JEPA | bounded predictive-state proxy `jepaPredict` |
| Adversarial gating / synthetic red team | `adversarialGate` + `src/red-team.ts` |
| CEV / constitutional refusal | constitutional predicates and fail-closed result |
| GCP | `GovernedCognitivePlane` |
| Gödel / ImandraX / SEGPA | deterministic invariant guards; ImandraX boundary is replaceable adapter, not proprietary reimplementation |
| OESI | evidence/confidence/contradiction gate |
| RAG 2.0 | temporal-weighted retrieval + grounding |
| MARS | one bounded metacognitive reflection cycle; no source/policy/secret mutation |
| Episodic / working / long-term / procedural memory | bitemporal stores + CoALA layers + procedural store |
| Retrospective correction / point-in-time recovery | deterministic correction and temporal recovery functions |
| Counterfactual reasoning / causal inference | `CounterfactualGraph` + `counterfactualScore` |
| Cognitive Modulation / Digital Nexus Core | bounded state introspection/modulation |
| Agent Devel / self-correction | gated development result + safe RSI transition |
| Offline replay / digital sleep / synaptic pruning | bounded replay, ranking and activity pruning |
| Meta-learning / curriculum | deterministic curriculum difficulty adjustment |
| Temporal decay / semantic caching | temporal weights + normalized cache keys |
| Anti-reward hacking | reward minus cost/risk penalty |
| Neurosymbolic integration | composition of symbolic invariants and policy gates |
| Recursive state representation | defensive Digital Nexus snapshots |
| Resource donation / adaptive load shedding | bounded capacity allocation and priority selection |
| Token pruning / prompt compression | bounded unique-token selection |
| Hard-negative mining | loss-ranked examples |
| Multimodal fusion / dynamic modality switching | score fusion + explicit available-modality selection |
| Zero-shot domain adaptation | domain/safety contract with `weightsChanged:false` |
| Cross-system handshakes | capability compatibility check |
| Chaos engineering | non-destructive deterministic failure planning |
| Vector topology / HNSW-style candidates | HDC + bounded candidate index abstractions |
| Automated firewalling / zero trust | deny-pattern gate + authentication/scope/risk gate |
| Pareto optimization | latency/cost/error-rate Pareto selection |
| Infinite-horizon planning | explicitly bounded horizon |
| Controlled noise | deterministic bounded perturbation |
| Legacy bridging | provider-neutral legacy adapter |
| Pre-trained concept retention | retention contract; no model weight training |
| Offline fallback | deterministic local fallback |
| A/B testing / shadow deployment | `abTest` + `shadowCompare` |
| Graceful degradation of trust | trust adjustment + threshold gate |
| Few-shot tool generation | non-executable tool plan only |
| Meta-architecture generation | bounded candidate representation only |
| Schema alignment | alias-based normalized mapping |
| Negotiation / BATNA / TCO | scored negotiation options, explicit BATNA and TCO aggregation |
| Data-driven decisions | metric-based comparison, A/B and TCO contracts |
| Conflict resolution / post-mortem | scored conflict choice + blame-free process-gap record |
| Emotional intelligence | human-fallback and blame-free escalation contracts; no simulated human emotions |
| Critical thinking | cross-examination, drift, firewall and adversarial gates |
| Delegation / teamwork | API contract validation + deduplicated squad roles |
| Adaptability / tech radar | ranked provider-neutral alternatives |
| Context-window optimization | recent-turn retention + bounded older-context summary |
| Strict input validation | required-field gate returning exact missing fields |
| Backoff / rate-limit resilience | bounded exponential backoff with jitter |
| RLAIF / memory consolidation | failure-memory store + preference penalty boundary |
| Asynchronous concurrency | bounded async batch partitioning |
| Latency budgeting | timeout/partial-result decision contracts |
| Creativity / exploration | bounded deterministic noise + epsilon exploration |
| Anomaly detection / concept drift | cosine similarity primitive + drift threshold |
| Predictive fetching / pre-computation | bounded candidate prefetch |
| Zero-trust sandboxing | authorization gate; generated tools remain non-executable |
| Global reward optimization | explicit reward/cost/risk objective; no unrestricted self-optimization |
| Model distillation / parameter sync | distillation-gap metric; no hidden weight synchronization |
| Service mesh / discovery | `ServiceRegistry` capability discovery |
| Long-polling / webhooks | job state + replay-safe event-id handler |
| Confidence / human fallback | threshold-based human routing |
| Gradient/weight penalization / DPO boundary | preference penalty signal; no autonomous weight mutation |
| Heuristic intuition | fast-path spam threshold |
| Schema enforcement / structured output | existing closed outcome schema + strict validation |
| Graceful degradation / load shedding | priority-based bounded shedding and local fallback |
| Fuzzy clarification | deterministic exact/substring clarification |
| Multi-step DAG planning | dependency-respecting topological plan |
| Semantic clustering / routing | semantic/HDC index abstractions and bounded candidate selection |
| Reasoning audit | formal/adversarial/constitutional gates; private chain-of-thought is not exposed or treated as proof |
| Global knowledge graph | G-memory / bitemporal graph abstractions |
| DeepMind research concepts | bounded architectural references only; no proprietary implementation claim |

## Safety boundary

The evolutionary stack, Rust SNN fast path, Zenoh transport, MARS and formal adapters cannot authorize a live phone transaction. SNN is a signal layer; Zenoh is transport; MARS is reflection; ImandraX-style verification is a proof/gate boundary. The authoritative incident policy, evidence, confidence and idempotency controls remain final operational authority. No requested capability grants arbitrary source mutation, credential mutation, policy mutation or unrestricted live execution.
