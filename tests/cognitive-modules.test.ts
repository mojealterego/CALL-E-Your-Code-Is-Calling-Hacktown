import { describe, expect, it } from "vitest";
import {
  CounterfactualGraph,
  HolographicMemory,
  McpGateway,
  WorkingMemory,
  compressPrompt,
  decisionCycle,
  evaluateMutation,
  hardNegatives,
  paretoFront,
  shedLoad,
  temporalDecay,
  trustAfterFailure,
} from "../src/cognitive-modules.js";

describe("bounded cognitive control modules", () => {
  it("keeps working memory bounded and expires stale context", () => {
    const memory = new WorkingMemory<string>(2);
    memory.set({ key: "low", value: "x", priority: 1 });
    memory.set({ key: "high", value: "y", priority: 5 });
    memory.set({ key: "new", value: "z", priority: 3 });
    expect(memory.get("low")).toBeUndefined();
    expect(memory.get("high")).toBe("y");
    memory.set({ key: "ttl", value: "gone", priority: 9, expiresAt: "2026-01-02T00:00:00Z" });
    expect(memory.get("ttl", "2026-01-03T00:00:00Z")).toBeUndefined();
  });

  it("provides deterministic HDC-style similarity and semantic indexing", async () => {
    const h = new HolographicMemory(128);
    expect(h.similarity(h.encode("route eta"), h.encode("route eta"))).toBe(1);
    const { ShimiIndex } = await import("../src/cognitive-modules.js");
    const index = new ShimiIndex<string>(h);
    index.add("1", "driver confirmed route and ETA", "hit", "2026-09-14T00:00:00Z");
    index.add("2", "weather forecast", "miss", "2026-09-14T00:00:00Z");
    expect(index.search("route ETA", 1, "2026-09-14T01:00:00Z")[0]?.value).toBe("hit");
  });

  it("runs bounded counterfactual analysis without mutating state", () => {
    const graph = new CounterfactualGraph();
    graph.addEdge({ from: "validation", to: "unsafe_resolution", weight: 0.9 });
    graph.addEdge({ from: "validation", to: "false_positive", weight: 0.2 });
    expect(graph.removeNode("validation")).toEqual({
      removed: "validation",
      affected: ["unsafe_resolution", "false_positive"],
      riskScore: 1,
    });
  });

  it("requires every gate before a mutation can reach shadow", () => {
    const candidate = { id: "m1", parent: "v1", change: "optimize-index", expectedGain: 0.4, resourceCost: 0.1 };
    expect(evaluateMutation(candidate, { sandbox: true, redTeam: true, formal: true, benchmarkGain: 0.2 }).eligibleForShadow).toBe(true);
    expect(evaluateMutation(candidate, { sandbox: true, redTeam: false, formal: true, benchmarkGain: 0.2 }).eligibleForShadow).toBe(false);
  });

  it("keeps MCP capabilities explicit and scoped", () => {
    const gateway = new McpGateway();
    gateway.register({ name: "memory.read", scopes: ["incident:read"] });
    expect(gateway.authorize("memory.read", "incident:read")).toBe(true);
    expect(gateway.authorize("memory.read", "phone:execute")).toBe(false);
  });

  it("implements bounded operational controls", () => {
    expect(decisionCycle({ policy: false, evidence: true, contradiction: false })).toBe("abort");
    expect(decisionCycle({ policy: true, evidence: false, contradiction: false })).toBe("recover");
    expect(decisionCycle({ policy: true, evidence: true, contradiction: false })).toBe("commit");
    expect(temporalDecay(30)).toBeCloseTo(0.5);
    expect(trustAfterFailure(1, 0.5)).toBeCloseTo(0.75);
    expect(shedLoad([
      { id: "a", priority: 1, estimatedMs: 10 },
      { id: "b", priority: 5, estimatedMs: 20 },
    ], 1)[0]?.id).toBe("b");
    expect(compressPrompt("route route eta evidence eta confidence", 4)).toBe("route eta evidence confidence");
    expect(hardNegatives([{ value: "easy", loss: 0.1 }, { value: "hard", loss: 0.9 }], 1)).toEqual(["hard"]);
  });

  it("selects a Pareto frontier instead of a single scalar optimum", () => {
    const frontier = paretoFront([
      { id: "balanced", latencyMs: 100, costUsd: 0.1, errorRate: 0.01 },
      { id: "slow", latencyMs: 200, costUsd: 0.2, errorRate: 0.02 },
      { id: "cheap", latencyMs: 80, costUsd: 0.05, errorRate: 0.03 },
    ]);
    expect(frontier.map((x) => x.id)).toEqual(["balanced", "cheap"]);
  });
});
