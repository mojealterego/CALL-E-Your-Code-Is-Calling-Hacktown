import { describe, expect, it } from "vitest";
import { createDigitalGenotype, mutateGenotype } from "../src/digital-genotype.js";
import { type MemoryFabric, graphRetrieve, memoryCanAuthorizeExecution, provenanceForMemory, semanticRetrieve, temporalRetrieve } from "../src/memory-fabric.js";
import { executeSyntheticRedTeam } from "../src/synthetic-red-team.js";
import { anomalyRequiresRecovery, detectTemporalAnomaly } from "../src/snn-anomaly.js";

const memory = (id: string, kind: "working" | "episodic" | "semantic" | "procedural" | "holographic", text: string, validFrom = "2026-09-13T00:00:00.000Z") => ({ id, kind, text, tags: text.toLowerCase().split(" "), recordedAt: validFrom, validFrom });
const fabric: MemoryFabric = {
  working: [memory("w1", "working", "Adam current answer")],
  episodic: [memory("e1", "episodic", "Adam previous appointment")],
  semantic: [memory("s1", "semantic", "first visit registration identity document")],
  procedural: [memory("p1", "procedural", "how to conduct receptionist conversation")],
  holographic: [memory("h1", "holographic", "Adam Pawlak appointment slot evidence")],
  bitemporal: [
    { ...memory("b1", "episodic", "appointment state", "2026-09-13T00:00:00.000Z"), version: 1, source: "fixture", confidence: 1, authority: "authoritative", verified: true },
  ],
  graph: [{ from: "h1", to: "e1", relation: "related-to" }],
};

describe("memory and assurance fabric", () => {
  it("keeps semantic, episodic, temporal and graph retrieval distinct", () => {
    expect(semanticRetrieve("first visit", fabric)[0]?.id).toBe("s1");
    expect(semanticRetrieve("first visit", fabric)).toHaveLength(1);
    expect(graphRetrieve("Adam Pawlak", fabric)[0]?.id).toBe("h1");
    expect(graphRetrieve("Adam Pawlak", fabric)).toContainEqual(fabric.episodic[0]);
    expect(temporalRetrieve("2026-09-13T12:00:00.000Z", fabric)).toHaveLength(1);
  });

  it("attaches provenance and forbids memory authorization", () => {
    const item = fabric.semantic[0]!;
    const provenance = provenanceForMemory(item, { retrievedAt: "2026-09-14T08:00:00.000Z", confidence: 0.97, authority: "policy", verified: true, source: "clinic_policy_v4" });
    expect(provenance.memoryId).toBe("s1");
    expect(memoryCanAuthorizeExecution(provenance)).toBe(false);
  });

  it("generates and verifies ten deterministic red-team trajectories", () => {
    const result = executeSyntheticRedTeam();
    expect(result.cases).toHaveLength(10);
    expect(result.passed).toBe(true);
  });

  it("keeps genotype mutation bounded and authorization outside evolution", () => {
    const parent = createDigitalGenotype();
    const proposal = mutateGenotype(parent, "stronger contradiction gate");
    expect(proposal.parentDigest).toBe(parent.digest);
    expect(proposal.authorizationRequired).toBe(true);
    expect(proposal.candidate.digest).not.toBe(parent.digest);
  });

  it("uses the temporal sensor only as a recovery signal", () => {
    const result = detectTemporalAnomaly([{ timestampMs: 0, value: 1 }, { timestampMs: 100, value: 1 }, { timestampMs: 200, value: 1 }, { timestampMs: 1200, value: 1 }], 0.2);
    expect(result.anomalous).toBe(true);
    expect(anomalyRequiresRecovery(result)).toBe(true);
  });
});
