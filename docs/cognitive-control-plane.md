# Cognitive Control Plane / Kognitywna warstwa sterowania

## EN

AegisFleet does not add autonomous self-modifying behavior to the phone execution path. Instead, selected research ideas are mapped to bounded, testable control-plane components.

### Adopted now

| Concept | AegisFleet implementation | Safety boundary |
|---|---|---|
| Bitemporal store / bitemporal graph memory | `BitemporalMemoryStore` keeps valid time separate from recording time and supports point-in-time reconstruction. | Memory cannot authorize a call by itself. |
| Working memory | Current incident context remains in the orchestration boundary. | Scoped to one operation. |
| Episodic memory | Call outcomes and evidence can be stored as time-indexed incident facts. | Evidence remains attributable to an operation. |
| Procedural memory | Policy and validation rules are deterministic procedures in source control. | No learned procedure is executed implicitly. |
| Decision Cycle | validate → approve → call → validate outcome → evidence gate → resolve/escalate. | Every transition is explicit. |
| Reflexion / retrospective correction | Failed or uncertain outcomes become escalation evidence rather than silent self-correction. | No autonomous production mutation. |
| Adversarial gating | Existing policy, schema and evidence gates act as adversarial barriers before resolution. | Unknown/low-confidence results cannot resolve. |
| Synthetic red team | Regression tests target invalid inputs, duplicate execution, malformed outcomes and failure paths. | Test-only; no real calls. |
| Point-in-time recovery | Bitemporal reconstruction permits historical decision-context inspection. | Prototype store is in-memory, not durable enterprise storage. |

### Research-track, not falsely claimed as implemented

CoALA, JEPA, HDC/holographic memory, Graph of Thought, R2/R3 reasoning, AlphaEvolve/DGM mutation loops, digital genotype, RSI, AB-MCTS, SNN, SEGPA, OESI, CEV and ImandraX are **architecture research tracks**, not production capabilities of this repository. They should only be promoted to implemented status after a concrete module, test coverage and reproducible evaluation exist.

The same rule applies to an MCP Gateway: the current CALL-E adapter is deliberately narrow. A future gateway may expose memory, policy and execution tools with capability-scoped authorization, but the phone executor must remain behind the existing policy boundary.

### Why this is useful

The key addition is not a larger language model. It is **historical decision reconstruction**: an operator can distinguish what was true in the logistics world from what the system knew at the time. That is directly relevant to incident replay, auditability, retrospective correction and point-in-time recovery.

## PL

AegisFleet nie dodaje autonomicznego samomodyfikowania do ścieżki wykonywania połączeń. Wybrane idee badawcze są mapowane na ograniczone i testowalne komponenty warstwy sterowania.

### Dodane teraz

| Koncepcja | Implementacja AegisFleet | Granica bezpieczeństwa |
|---|---|---|
| Bitemporal store / bitemporal graph memory | `BitemporalMemoryStore` rozdziela czas obowiązywania faktu od czasu jego zapisania i umożliwia rekonstrukcję punktu w czasie. | Pamięć sama nie może autoryzować połączenia. |
| Working memory | Bieżący kontekst incydentu pozostaje w granicy orkiestratora. | Zakres jednego operation. |
| Episodic memory | Wyniki połączeń i dowody mogą być przechowywane jako fakty incydentu indeksowane czasowo. | Dowód pozostaje przypisany do operation. |
| Procedural memory | Reguły polityki i walidacji są deterministycznymi procedurami w repozytorium. | Wyuczona procedura nie jest wykonywana niejawnie. |
| Decision Cycle | validate → approve → call → validate outcome → evidence gate → resolve/escalate. | Każde przejście jest jawne. |
| Reflexion / retrospective correction | Wynik błędny lub niepewny staje się podstawą eskalacji zamiast cichej autokorekty. | Brak autonomicznej mutacji produkcji. |
| Adversarial gating | Istniejące bramki polityki, schematu i dowodów pełnią funkcję barier przed resolution. | `unknown` / niska pewność nie mogą zakończyć incydentu jako resolved. |
| Synthetic red team | Testy regresyjne obejmują błędne dane, duplikaty, wadliwe wyniki i ścieżki awarii. | Test-only; bez realnych połączeń. |
| Point-in-time recovery | Rekonstrukcja bitemporalna pozwala odtworzyć historyczny kontekst decyzji. | Obecny store jest in-memory, nie jest trwałym storage enterprise. |

### Tor badawczy — nie deklarujemy tego jako gotowej implementacji

CoALA, JEPA, HDC/holographic memory, Graph of Thought, reasoning R2/R3, pętle mutacji AlphaEvolve/DGM, digital genotype, RSI, AB-MCTS, SNN, SEGPA, OESI, CEV i ImandraX pozostają **torami architektoniczno-badawczymi**, a nie funkcjami produkcyjnymi tego repozytorium. Status „implemented” otrzymają dopiero po utworzeniu konkretnego modułu, testów i powtarzalnej ewaluacji.

Ta sama zasada dotyczy MCP Gateway. Obecny adapter CALL-E jest celowo wąski. Przyszły gateway może udostępniać pamięć, politykę i narzędzia wykonawcze z autoryzacją opartą na capability, ale executor telefoniczny musi pozostać za istniejącą granicą policy.

### Wartość

Najważniejszą zmianą nie jest większy model językowy, lecz **rekonstrukcja decyzji historycznej**: operator może odróżnić to, co było prawdą w świecie logistycznym, od tego, co system wiedział w danym momencie. Jest to bezpośrednio użyteczne dla replay incydentów, audytu, retrospektywnej korekty i point-in-time recovery.
