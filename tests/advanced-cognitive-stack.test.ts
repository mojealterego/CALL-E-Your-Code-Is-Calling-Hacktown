import { describe, expect, it } from "vitest";
import {
  CEV, CoALAMemoryController, DigitalNexusCore, GMemory, GraphOfThought, RAG2,
  SEGPA, abMcts, abTest, adversarialGate, alphaEvolve, antiRewardHacking,
  advanceRSI, constitutionalEvaluate, counterfactualScore, curriculumDifficulty,
  digitalGenotype, godelGuard, hdcEncode, hdcSimilarity, imandraXGuard, jepaPredict,
  modalitySwitch, mutateGenotype, offlineReplay, promptPrune, resourceDonate,
  schemaAlign, selectEvolution, semanticCacheKey, snnEncode, synapticPrune,
  temporalKnowledgeWeight, trustGate, type EvolutionCandidate,
} from "../src/advanced-cognitive-stack.js";

describe("advanced bounded cognitive stack", () => {
  it("implements CoALA-style layered memory and graph memory", () => {
    const memory = new CoALAMemoryController<string>(2);
    memory.write({ id: "w", layer: "working", content: "now", validFrom: "2026-09-14T00:00:00Z", recordedAt: "2026-09-14T00:00:00Z", confidence: 1 });
    memory.write({ id: "e", layer: "episodic", content: "event", validFrom: "2026-09-14T00:00:00Z", recordedAt: "2026-09-14T00:01:00Z", confidence: 0.9 });
    expect(memory.read("episodic")[0]?.content).toBe("event");
    const graph = new GMemory<string>();
    graph.addNode({ id: "a", value: "A" }); graph.addNode({ id: "b", value: "B" });
    graph.addEdge({ from: "a", to: "b", relation: "causes", weight: 1 });
    expect(graph.neighbors("a")[0]?.value).toBe("B");
  });

  it("provides HDC, RAG 2.0 retrieval and Graph-of-Thought", () => {
    const a = hdcEncode("route eta");
    expect(hdcSimilarity(a, hdcEncode("route eta"))).toBe(1);
    const rag = new RAG2<string>();
    rag.add({ id: "1", text: "driver confirmed route ETA", value: "evidence", recordedAt: "2026-09-14T00:00:00Z" });
    expect(rag.ground("route ETA", 1)[0]?.value).toBe("evidence");
    const got = new GraphOfThought();
    got.addNode({ id: "good", claim: "safe", score: 0.9 }); got.addNode({ id: "bad", claim: "unsafe", score: 1 });
    got.addEdge({ from: "bad", to: "good", relation: "contradicts" });
    expect(got.resolve().map((n) => n.id)).toEqual(["good"]);
  });

  it("keeps AlphaEvolve/DGM genotype mutations gated", () => {
    const genotype = digitalGenotype(["router"]);
    const mutated = mutateGenotype(genotype, "bounded-cache");
    expect(mutated.generation).toBe(1);
    const parent: EvolutionCandidate = { id: "p", genotype, fitness: 1, computeCost: 1, testsPassed: true, redTeamPassed: true, formalPassed: true };
    const candidate = alphaEvolve(parent, "bounded-cache", 2, 0.5, { sandbox: true, redTeam: true, formal: true });
    expect(selectEvolution([candidate])?.id).toBe(candidate.id);
    expect(selectEvolution([alphaEvolve(parent, "unsafe", 3, 0.1, { sandbox: true, redTeam: false, formal: true })])).toBeUndefined();
  });

  it("enforces the RSI pipeline and formal/constitutional gates", () => {
    expect(advanceRSI({ stage: "sandbox", version: "1", changeId: "x", approved: false }, { sandbox: true })).toMatchObject({ stage: "red-team" });
    expect(advanceRSI({ stage: "sandbox", version: "1", changeId: "x", approved: false }, { sandbox: false })).toMatchObject({ stage: "rollback" });
    expect(godelGuard({ ok: true }, [{ id: "ok", check: (x) => (x as { ok: boolean }).ok }])).toBe(true);
    expect(imandraXGuard({}, [{ id: "never", check: () => false }])).toBe(false);
    expect(SEGPA({}, [{ id: "never", check: () => false }])).toBe(false);
    const rules = [{ id: "safe", predicate: (x: unknown) => x === "safe" }];
    expect(constitutionalEvaluate("safe", rules).allowed).toBe(true);
    expect(CEV("bad", rules)).toBe(false);
    expect(adversarialGate("x", [(x) => x === "attack"])).toBe(true);
  });

  it("covers SNN/JEPA-style predictive and temporal primitives", () => {
    expect(snnEncode([0.2, 0.8, 0.7], 0.5).map((x) => x.neuron)).toEqual([1, 2]);
    expect(jepaPredict("route eta", "route eta").error).toBe(0);
    expect(temporalKnowledgeWeight(30)).toBeCloseTo(0.5);
    expect(curriculumDifficulty(0.9, 2)).toBe(3);
  });

  it("provides bounded decision, counterfactual and A/B controls", () => {
    const a = { id: "a", utility: 1, risk: 0.2, cost: 0.1 };
    const b = { id: "b", utility: 1.5, risk: 0.1, cost: 0.1 };
    expect(abMcts([a, b], 8)?.id).toBe("b");
    expect(counterfactualScore(a, b)).toBeCloseTo(0.5);
    expect(abTest(1, 2, (x) => x).winner).toBe("candidate");
    expect(antiRewardHacking(1, 0.2, 0.1)).toBeCloseTo(0.7);
  });

  it("implements offline replay, pruning, schema alignment and resource controls", () => {
    expect(offlineReplay([{ id: "easy", observation: 1, outcome: 1, difficulty: 1 }, { id: "hard", observation: 2, outcome: 2, difficulty: 9 }], 1)[0]?.id).toBe("hard");
    expect(synapticPrune([{ value: "a", activity: 0.1 }, { value: "b", activity: 0.9 }], 0.5)).toEqual(["b"]);
    expect(schemaAlign({ eta: 10 }, { eta: "estimated_eta" })).toEqual({ estimated_eta: 10 });
    expect(modalitySwitch("voice", ["structured"])).toBe("structured");
    expect(resourceDonate(4, 7)).toBe(4);
    expect(promptPrune(["a", "a", "b"], 2)).toEqual(["a", "b"]);
    expect(semanticCacheKey("A  B")).toBe(semanticCacheKey("a b"));
    expect(trustGate(0.8, 0.7)).toBe(true);
  });

  it("keeps Digital Nexus introspection bounded and immutable to callers", () => {
    const core = new DigitalNexusCore({ version: "1", capabilities: ["read"], trust: 0.8, memoryLayers: ["working", "episodic"] });
    const state = core.introspect(); state.capabilities.push("mutated");
    expect(core.introspect().capabilities).toEqual(["read"]);
    core.modulate({ addCapability: "sandbox", trust: 0.6 });
    expect(core.introspect().trust).toBe(0.6);
  });
});
