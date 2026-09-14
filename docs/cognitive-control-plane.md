# Cognitive Control Plane / Kognitywna warstwa sterowania

## EN

AegisFleet does not put autonomous self-modifying behavior on the phone execution path. Requested cognitive and evolutionary ideas are separated into concrete deterministic control primitives and research-track model integrations.

### Implemented bounded primitives

| Requested direction | Concrete implementation | Boundary |
|---|---|---|
| Bitemporal / bitemporal graph memory | `BitemporalMemoryStore` with valid-time, recording-time and point-in-time reconstruction. | Memory cannot authorize execution. |
| CoALA-inspired memory separation | Working, episodic and procedural memory categories. | Categories are explicit; no hidden learned policy. |
| Working memory | `WorkingMemory` with capacity and TTL. | Per-process context only. |
| Long-term / episodic memory | Bitemporal store and semantic index. | Prototype storage is in-memory. |
| Procedural memory | Source-controlled policy, validation and decision procedures. | No implicit learned procedure. |
| Holographic memory / HDC | Deterministic binary hypervector encoder and similarity. | Prototype associative representation, not a trained HDC model. |
| Shimi index / semantic retrieval | `ShimiIndex`: lexical overlap + HDC similarity + temporal decay. | Deterministic index; no claim of proprietary Shimi implementation. |
| RAG 2.0 direction | Retrieval layer can combine indexed memory with time decay before a decision. | Retrieval is evidence/context, never authority. |
| Decision / Decision Cycle | Explicit validate → approve → execute → reconcile → commit/abort/recover. | Policy and evidence remain authoritative. |
| Reflexion loop | `reflectOnExecution()` stores retrospective findings. | Findings cannot change incident state. |
| Retrospective correction | Findings encode observation + correction guidance. | Human/policy review required for consequential change. |
| Adversarial gating | Policy, schema, evidence, contradiction and replay barriers. | Unsafe/unknown states escalate. |
| Synthetic red team | Deterministic adversarial regression suite. | Test-only; no real calls. |
| Point-in-time recovery | Bitemporal `asOf(validAt, recordedAt)` reconstruction. | Prototype is not durable enterprise storage. |
| Counterfactual reasoning | `CounterfactualGraph` removes a node in a copy-like analysis and reports affected consequences. | No production mutation. |
| MCP gateway | `McpGateway` capability registry with explicit scopes. | No phone execution capability is granted by this module. |
| Semantic caching | `ShimiIndex` provides deterministic retrieval reuse. | No external cache dependency in prototype. |
| Temporal decay | Exponential half-life scoring. | Decay is a ranking heuristic, not truth deletion. |
| Pareto optimization | `paretoFront()` retains non-dominated latency/cost/error candidates. | No single metric can bypass safety gates. |
| Adaptive load shedding | `shedLoad()` keeps highest-priority work under a bound. | Does not drop safety-critical policy checks. |
| Prompt compression | Deterministic duplicate/token pruning. | Context optimization only; no semantic authority. |
| Hard-negative mining | `hardNegatives()` selects highest-loss examples for evaluation. | Evaluation aid, not autonomous weight updates. |
| Trust regulation | Failure severity reduces a bounded trust score. | Reduced trust cannot itself authorize privileges. |
| Mutation / DGM / AlphaEvolve / RSI control loop | `evaluateMutation()` plus explicit stage progression: sandbox → red-team → formal-check → benchmark → shadow → approval → release/rollback. | Candidates are data-only; no source overwrite, production access or hot-swap. |
| Digital Nexus / meta-state | `SystemState` + `introspect()` provide explicit version/capability/error/latency/trust state. | Snapshot only; no self-directed privilege escalation. |
| Resource donation / load balancing | Priority-based work selection is available as a deterministic resource-control primitive. | Host scheduler owns actual compute allocation. |
| Graceful degradation of trust | Bounded trust decay on failures. | Does not silently remove safety controls. |

### Research-track integrations

The repository does **not** claim to contain the actual learned models or proprietary systems named in the request. CoALA, JEPA, Graph of Thought, R2/R3 reasoning, SNN, SEGPA, OESI, CEV, ImandraX, full AlphaEvolve/DGM code synthesis, digital genotype, autonomous RSI, AB-MCTS, DeepMind architectures and learned neural-weight mutation remain research tracks. They require real model implementations, dependencies, benchmarks and reproducible evaluation before they can be marked implemented.

Likewise, GCP is treated as an infrastructure target rather than an invented local implementation; Gödel-style self-reference is represented only by bounded system-state introspection; CEV remains a policy-research direction; and formal theorem proving is a future adapter boundary rather than a false claim of proof completeness.

### Safe evolutionary protocol

Any future code-generating evolution engine must follow this non-negotiable sequence:

```text
OBSERVE
  → PROFILE
  → HYPOTHESIS
  → GENERATE CANDIDATE
  → AIR-GAPPED SANDBOX
  → SYNTHETIC RED TEAM
  → FORMAL / PROPERTY CHECK
  → BENCHMARK
  → SHADOW
  → HUMAN / POLICY APPROVAL
  → ATOMIC RELEASE
  → ROLLBACK
```

No generated candidate may directly modify the production phone executor, secrets, policy rules, audit history or authorization boundaries. Resource cost, latency, correctness and safety must be evaluated together. A faster candidate that weakens a safety invariant is rejected.

## PL

AegisFleet nie umieszcza autonomicznego samomodyfikowania w ścieżce wykonywania połączeń. Żądane idee kognitywne i ewolucyjne są rozdzielone na konkretne deterministyczne mechanizmy sterowania oraz osobny tor badawczy dla rzeczywistych modeli.

### Wdrożone ograniczone mechanizmy

- `BitemporalMemoryStore`: valid-time + recording-time + point-in-time recovery.
- Working / episodic / procedural memory.
- `WorkingMemory`: limit pojemności i TTL.
- HDC/holographic associative memory jako deterministyczne wektory binarne.
- Shimi-style semantic index łączący overlap leksykalny, podobieństwo HDC i temporal decay.
- RAG/retrieval jako warstwa kontekstu, nigdy jako autorytet decyzji.
- Decision Cycle: validate → approve → execute → reconcile → commit/abort/recover.
- Reflexion loop + retrospective correction w pamięci epizodycznej.
- Adversarial gating i synthetic red team.
- Counterfactual causal graph.
- Capability-scoped MCP Gateway boundary.
- Semantic caching, temporal decay, Pareto front, adaptive load shedding, prompt compression i hard-negative mining.
- Bounded trust regulation i introspekcja `SystemState`.
- Gated DGM/AlphaEvolve/RSI mutation-evaluation loop bez autonomicznego nadpisywania kodu.

### Czego celowo nie udajemy

CoALA jako pełnego frameworka uczenia, JEPA, GoT, R2/R3, SNN, SEGPA, OESI, CEV, ImandraX, pełnego AlphaEvolve/DGM, digital genotype, autonomicznego RSI, AB-MCTS, rzeczywistych architektur DeepMind ani uczenia wag neuronowych nie oznaczamy jako zaimplementowanych modeli. Takie oznaczenie wymagałoby konkretnego modelu, testów, zależności i powtarzalnej ewaluacji.

GCP pozostaje celem infrastrukturalnym, Gödel jest reprezentowany jedynie przez ograniczoną introspekcję stanu, a formalne dowodzenie jest przyszłym adapterem. Nie deklarujemy gwarancji matematycznych, których kod nie zapewnia.

### Bezpieczna pętla ewolucyjna

```text
OBSERVE → PROFILE → HYPOTHESIS → GENERATE CANDIDATE
→ AIR-GAPPED SANDBOX → SYNTHETIC RED TEAM
→ FORMAL / PROPERTY CHECK → BENCHMARK → SHADOW
→ HUMAN / POLICY APPROVAL → ATOMIC RELEASE → ROLLBACK
```

Kandydat nie może sam zmienić produkcyjnego executora telefonicznego, sekretów, polityk, historii audytu ani granic autoryzacji. Zmiana, która jest szybsza, ale osłabia safety invariant, jest odrzucana.
