import { describe, expect, it } from "vitest";
import { CognitiveMemoryFabric, buildKnowledgeGraph, buildThoughtGraph, claimFromMemory, memoryReceipt, predictNextState, reconcileThoughts } from "../src/cognitive-fabric.js";
import type { Incident } from "../src/domain.js";

const incident: Incident = { id: "i-cog", vehicleId: "v-1", phone: "test-phone", closure: "appointment", requestedBy: "Adam", goal: "confirm appointment" };
const now = "2026-09-14T05:00:00.000Z";

describe("cognitive memory fabric", () => {
  it("keeps semantic, episodic and temporal retrieval distinct", () => {
    const fabric = new CognitiveMemoryFabric();
    fabric.put({ id: "sem-1", dimension: "semantic", content: "first visit requires registration and information form", concepts: ["first_visit", "registration"], source: "clinic-policy", confidence: 0.97, validFrom: now, recordedAt: now, verified: true });
    fabric.put({ id: "ep-1", dimension: "episodic", content: "Adam confirmed a previous appointment", concepts: ["Adam", "appointment"], source: "call-e", confidence: 0.9, validFrom: now, recordedAt: now, verified: false });
    expect(fabric.semanticRetrieve("first visit registration")[0]?.record.id).toBe("sem-1");
    expect(fabric.episodicRetrieve("Adam")[0]?.id).toBe("ep-1");
    expect(fabric.temporalRetrieve(now).map((r) => r.id)).toEqual(expect.arrayContaining(["sem-1", "ep-1"]));
  });

  it("attaches provenance and a tamper-evident receipt to retrieved memory", () => {
    const fabric = new CognitiveMemoryFabric();
    const record = fabric.put({ id: "mem-1", dimension: "semantic", content: "identity policy", concepts: ["identity"], source: "policy-v4", confidence: 0.99, validFrom: now, recordedAt: now, verified: true });
    expect(record.provenance.source).toBe("policy-v4");
    expect(record.provenance.verified).toBe(true);
    expect(memoryReceipt(record)).toHaveLength(64);
    expect(claimFromMemory(record, "identity_policy").status).toBe("TRUE");
  });

  it("builds a graph over memory and supports bounded traversal", () => {
    const fabric = new CognitiveMemoryFabric();
    const a = fabric.put({ id: "a", dimension: "episodic", content: "Adam appointment", concepts: ["Adam", "appointment"], source: "call", confidence: 0.8, validFrom: now, recordedAt: now, verified: false });
    const b = fabric.put({ id: "b", dimension: "semantic", content: "appointment procedure", concepts: ["appointment", "procedure"], source: "policy", confidence: 0.9, validFrom: now, recordedAt: now, verified: true });
    const graph = buildKnowledgeGraph([a, b]);
    expect(graph.edges.some((e) => e.from === "a" && e.to === "b")).toBe(true);
    expect(fabric.graphRetrieve("a", graph, 1).map((r) => r.id)).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("keeps GoT hypotheses explicit and recovers on contradiction", () => {
    const graph = buildThoughtGraph([
      { id: "h1", hypothesis: "Adam confirmed", support: ["call-e"] },
      { id: "h2", hypothesis: "Adam wants reschedule", support: ["conversation"], conflicts: ["h1"] },
    ]);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges.some((e) => e.relation === "contradicts")).toBe(true);
    expect(reconcileThoughts(graph).action).toBe("recover");
  });

  it("uses JEPA-style prediction as a pre-decision model, never as proof", () => {
    const prediction = predictNextState(incident, { route_acceptance: "yes", eta_update_time: "11:30", escalation_needed: "none", evidence_summary: "provider confirmed", confidence: "high" });
    expect(prediction.observationRequired).toBe(true);
    expect(prediction.predictions[0]?.label).toBe("appointment-confirmed");
    expect(prediction.predictions[0]?.probability).toBeLessThan(1);
  });
});
