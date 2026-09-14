import { describe, expect, it } from "vitest";
import { buildCategory, mapByFunctor, hyperbaricLogicRank, epistemicDefragmentation, spawnDgmInstances, mergeValidatedInstances, transpileIntent, verifyMutation, optimizeSubstrate, hybridQuantumPlan, energyAwareGate, provableAlignment, epistemicHumility } from "../src/transcendence-89-99.js";

describe("bounded transcendence contracts 89-99", () => {
  it("89: maps category objects and structure-preserving morphisms", () => {
    const a = buildCategory([{ id: "a", domain: "bio", attributes: {} }, { id: "b", domain: "bio", attributes: {} }], [{ id: "f", from: "a", to: "b", preserves: ["causal-order"] }]);
    const b = buildCategory([{ id: "x", domain: "econ", attributes: {} }, { id: "y", domain: "econ", attributes: {} }], [{ id: "g", from: "x", to: "y", preserves: ["causal-order"] }]);
    expect(mapByFunctor(a, b, { a: "x", b: "y" }).preservesComposition).toBe(true);
  });
  it("90: retains multi-valued and perspectival beliefs", () => {
    expect(hyperbaricLogicRank([{ proposition: "p", value: "unknown", evidence: .4 }, { proposition: "p", value: "true", evidence: .9 }])[0]?.value).toBe("true");
  });
  it("91: isolates contradictions rather than silently deleting them", () => {
    const r = epistemicDefragmentation([{ proposition: "p", value: "true", evidence: 1 }, { proposition: "p", value: "false", evidence: 1 }]);
    expect(r.conflicts[0]?.isolated).toBe(true); expect(r.retained[0]?.value).toBe("unknown");
  });
  it("92: branches are bounded and only validated branches merge", () => {
    const branches = spawnDgmInstances("core", ["m1", "m2"], ["sandbox-a", "sandbox-b"]);
    const merged = mergeValidatedInstances(branches, i => i.mutation === "m1");
    expect(merged.accepted).toHaveLength(1); expect(merged.rejected).toHaveLength(1);
  });
  it("93: transpilation is non-executable by default", () => {
    expect(transpileIntent("route optimizer", "verilog").executable).toBe(false);
  });
  it("94: formal constraints and adversarial gate are mandatory", () => {
    expect(verifyMutation("c1", [{ name: "termination", predicate: () => true }], () => true).approved).toBe(true);
    expect(verifyMutation("c2", [{ name: "termination", predicate: () => false }], () => true).approved).toBe(false);
  });
  it("95: substrate choice respects thermal headroom", () => {
    expect(optimizeSubstrate([{ target: "cpu", estimatedLatencyMs: 10, estimatedEnergyJ: 3, thermalHeadroom: .1 }, { target: "gpu", estimatedLatencyMs: 20, estimatedEnergyJ: 2, thermalHeadroom: .8 }])?.target).toBe("gpu");
  });
  it("96: quantum planning remains an explicit backend boundary", () => {
    expect(hybridQuantumPlan("search", "grover", "simulator").backend).toBe("simulator");
  });
  it("97: energy and thermal budgets fail closed", () => {
    expect(energyAwareGate(10, 11, .2).allowed).toBe(false); expect(energyAwareGate(10, 5, .2).allowed).toBe(true);
  });
  it("98: constitutional alignment must pass before approval", () => {
    expect(provableAlignment(["human-safety"], ["human-safety", "auditability"], [v => v.includes("human-safety")]).approved).toBe(true);
    expect(provableAlignment(["human-safety"], ["optimization"], [v => v.includes("human-safety")]).approved).toBe(false);
  });
  it("99: humility reserves compute and disables low-confidence decisions", () => {
    expect(epistemicHumility("resolve", .4, ["evidence incomplete"]).decision).toBeUndefined();
    expect(epistemicHumility("resolve", .9, ["evidence present"]).rollbackReady).toBe(true);
  });
});
