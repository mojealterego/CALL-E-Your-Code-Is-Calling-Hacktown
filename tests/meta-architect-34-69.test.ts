import { describe, expect, it } from "vitest";
import {
  adaptDomain, alignSchema, auditReasoning, bayesianEvidence, boundedHorizonScore, chaosPlan,
  constitutionalRefusal, controlledNoise, counterfactual, crossExamine, curriculum, dagOrder,
  defragmentMemory, donateCapacity, evolutionFitness, evaluateEvolution, fewShotToolPlan,
  fuseModalities, governedRSI, handshake, hardNegativeWeight, knowledgeGraphMerge, latentMessage,
  legacyBridge, loadShed, mamlStep, metaArchitecturePlan, offlineConsolidate, offlineFallback,
  paretoFront, pretrainedRetention, semanticCacheKey, snapshotState, synapticPrune, switchModality,
  temporalDecay, trustDegrade, detectParadigmShift, homeostaticGate,
  type CounterfactualGraph, type EvolutionProposal, type RecursiveState,
} from "../src/meta-architect-34-69.js";

describe("governed meta-architect capabilities 34-69", () => {
  it("gates genetic evolution through sandbox, red-team, formal, benchmark, shadow and approval", () => {
    const proposal: EvolutionProposal = { id: "g2-cache", parentVersion: "g1", mutation: "cache", generation: 2, expectedGain: 4, computeCost: 1, riskPenalty: 0.5 };
    expect(evolutionFitness(4, 1, 0.5)).toBe(2.5);
    expect(evaluateEvolution(proposal, { sandbox: true, redTeam: true, formal: true, benchmark: true, shadow: true, approval: true }).accepted).toBe(true);
    expect(evaluateEvolution(proposal, { sandbox: true, redTeam: true, formal: false, benchmark: true, shadow: true, approval: true }).accepted).toBe(false);
    const state: RecursiveState = { version: "g1", capabilities: ["read"], rateLimits: { api: 10 }, errorRate: 0, latencyMs: 20, tools: ["mcp"], snapshotAt: "2026-09-14T00:00:00Z" };
    expect(governedRSI({ state, proposal, gates: { sandbox: true, redTeam: true, formal: true, benchmark: true, shadow: true, approval: true } }).status).toBe("release");
    expect(governedRSI({ state, proposal, gates: { sandbox: true } }).status).toBe("rollback");
  });

  it("covers counterfactuals, offline replay, meta-learning and homeostasis", () => {
    const graph: CounterfactualGraph = { nodes: ["validation", "attack", "incident"], edges: [{ from: "validation", to: "incident", effect: -0.8 }] };
    expect(counterfactual(graph, "validation", "incident")).toBe(-0.8);
    expect(detectParadigmShift({ priorLoss: 0.1, currentLoss: 0.5, threshold: 0.3 })).toBe(true);
    expect(mamlStep(2, 0.1)).toBe(-0.2);
    expect(homeostaticGate({ gain: 5, computeCost: 2, risk: 1, maxCompute: 3, maxRisk: 2 })).toBe(true);
    const records = [{ id: "a", input: 1, output: 1, loss: 0.1, activity: 0.9, recordedAt: "2026-09-14T00:00:00Z" }, { id: "b", input: 2, output: 2, loss: 0.9, activity: 0.8, recordedAt: "2026-09-14T00:01:00Z" }];
    expect(offlineConsolidate(records, 1)[0]?.id).toBe("b");
    expect(synapticPrune(records, 0.85).map((x) => x.id)).toEqual(["a"]);
  });

  it("covers memory, latent communication, cross-examination and refusal", () => {
    expect(semanticCacheKey(" A   B ")).toBe(semanticCacheKey("a b"));
    expect(latentMessage([1.1234567], "v1").vector[0]).toBe(1.123457);
    expect(crossExamine("claim", [(x) => x === "claim" ? "unsupported" : null]).verdict).toBe("fail");
    expect(constitutionalRefusal("delete knowledge base", ["delete knowledge"])).toBe(true);
    expect(temporalDecay(30)).toBeCloseTo(0.5);
    expect(donateCapacity(4, 9)).toBe(4);
    expect(hardNegativeWeight(2)).toBe(3);
  });

  it("covers multimodal, load, domain, handshakes, chaos and Pareto", () => {
    expect(fuseModalities({ text: "x", voice: "y", structured: { ok: true }, imageEmbedding: [1] })).toBe(1);
    expect(loadShed([{ priority: 1 }, { priority: 3 }], 1)[0]?.priority).toBe(3);
    expect(adaptDomain("medical", "strict").weightsChanged).toBe(false);
    expect(handshake(["zenoh", "mcp"], "mcp").accepted).toBe(true);
    expect(chaosPlan(["api", "db"], "api").survivors).toEqual(["db"]);
    expect(paretoFront([{ latencyMs: 10, costUsd: 1, errorRate: 0.1 }, { latencyMs: 20, costUsd: 2, errorRate: 0.2 }])).toHaveLength(1);
    expect(boundedHorizonScore(10, 0.5, 4)).toBe(8);
    expect(controlledNoise(1, 1)).not.toBe(1);
  });

  it("covers legacy retention, offline fallback, curriculum, schemas, modalities and Bayesian A/B", () => {
    expect(legacyBridge("COBOL", "TX").sourceOfTruth).toBe("legacy");
    expect(pretrainedRetention(["logic"], ["routing"]).frozenConcepts).toEqual(["logic"]);
    expect(offlineFallback(undefined, "local")).toEqual({ mode: "offline", value: "local" });
    expect(curriculum(0.9, 2)).toBe(3);
    expect(defragmentMemory([{ key: "a", value: 1 }, { key: "a", value: 2 }])).toEqual([2]);
    expect(alignSchema({ eta: 10 }, { eta: "estimated_eta" })).toEqual({ estimated_eta: 10 });
    expect(switchModality("voice", ["structured"])).toBe("structured");
    expect(bayesianEvidence(5, 10, 8, 10)).toBeGreaterThan(0);
    expect(trustDegrade(0.9, 0.3)).toBeCloseTo(0.6);
  });

  it("covers tool generation, meta-architecture, schema, fuzzy clarification, DAG, routing, audit and graph merge", () => {
    expect(fewShotToolPlan("inspect", ["read"]).executable).toBe(false);
    expect(metaArchitecturePlan("new router", ["safe", "bounded"]).requiresApproval).toBe(true);
    expect(snapshotState({ version: "1", capabilities: ["x"], rateLimits: {}, errorRate: 0, latencyMs: 1, tools: [], snapshotAt: "now" }).version).toBe("1");
    expect(dagOrder([{ id: "a", dependsOn: [] }, { id: "b", dependsOn: ["a"] }])).toEqual(["a", "b"]);
    expect(auditReasoning(["p1"], "c").audited).toBe(true);
    const merged = knowledgeGraphMerge(new Map([["a", 1]]), new Map([["b", 2]]));
    expect(merged.get("b")).toBe(2);
  });
});
