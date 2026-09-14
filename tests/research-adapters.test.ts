import { describe, expect, it } from "vitest";
import {
  asyncConcurrency, backoffDelay, bayesianAB, controlledNoise, crossExamine, dagPlan,
  firewallGate, fewShotToolPlan, fuzzyClarification, hnswStyleCandidates, infiniteHorizonPlan,
  latentSpaceMessage, latencyBudget, legacyBridge, mamlStep, metaArchitectureGeneration,
  modelDistill, multimodalFusion, offlineFallback, predictiveFetch, pretrainedRetention,
  zeroShotDomainAdaptation, zeroTrustAuthorize,
} from "../src/research-adapters.js";

describe("bounded research adapters", () => {
  it("covers latent communication, cross-examination and firewalling", () => {
    const message = latentSpaceMessage("agent-a", [1, 0, 1]);
    expect(message.vector).toEqual([1, 0, 1]);
    expect(crossExamine("claim", ["why?", "counterexample?"]).passed).toBe(true);
    expect(firewallGate("safe operation", [/delete-all/i])).toBe(true);
    expect(firewallGate("delete-all", [/delete-all/i])).toBe(false);
  });
  it("bounds planning, noise, legacy retention and offline fallback", () => {
    expect(infiniteHorizonPlan([1, 2, 3], 2)).toEqual([1, 2]);
    expect(controlledNoise(10, 42, 0)).toBe(10);
    expect(legacyBridge("legacy").source).toBe("legacy");
    expect(pretrainedRetention("base", "specialist").base).toBe("base");
    expect(offlineFallback(undefined, "local")).toBe("local");
  });
  it("keeps meta-architecture generation non-executable and bounded", () => {
    expect(fewShotToolPlan("temporary", ["a", "b"]).executable).toBe(false);
    expect(metaArchitectureGeneration(["policy", "memory"], 3)).toHaveLength(3);
    expect(zeroShotDomainAdaptation("logistics", "strict").weightsChanged).toBe(false);
    expect(mamlStep(1, 0.5).adapted).toBe(true);
    expect(modelDistill(0.9, 0.85).acceptable).toBe(true);
  });
  it("provides Bayesian, multimodal, fetching, resilience and concurrency primitives", () => {
    expect(bayesianAB(0.5, 8, 10)).toBeGreaterThan(0.5);
    expect(multimodalFusion([0.8, 1])).toBeCloseTo(0.9);
    expect(predictiveFetch([1, 2, 3], 2)).toEqual([1, 2]);
    expect(backoffDelay(3, 100, 500)).toBe(500);
    expect(latencyBudget(80, 100).remainingMs).toBe(20);
    expect(asyncConcurrency([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("supports fuzzy clarification, DAG planning, HNSW-style bounded candidates and zero trust", () => {
    expect(fuzzyClarification(["yes", "no"], "YES")).toBe("yes");
    expect(dagPlan(["a", "b", "c"], { c: ["b"], b: ["a"] })).toEqual(["a", "b", "c"]);
    expect(hnswStyleCandidates([1, 2, 3], 2)).toEqual([1, 2]);
    expect(zeroTrustAuthorize(true, true, true)).toBe(true);
    expect(zeroTrustAuthorize(true, true, false)).toBe(false);
  });
});
