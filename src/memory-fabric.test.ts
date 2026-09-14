import { describe, expect, it } from "vitest";
import { emptyMemoryFabric, graphRetrieve, holographicRetrieve, memoryCanAuthorizeExecution, provenanceForBitemporalMemory, retrieveWholeMemory, semanticRetrieve, temporalRetrieve, workingRetrieve } from "./memory-fabric.js";

const now = "2026-09-14T10:00:00.000Z";
function fabric() {
  const value = emptyMemoryFabric();
  value.working.push({ id: "work-1", kind: "working", text: "Adam appointment confirmation in progress", tags: ["Adam", "appointment"], recordedAt: now, validFrom: now });
  value.semantic.push({ id: "sem-1", kind: "semantic", text: "first visit registration policy", tags: ["first visit", "registration"], recordedAt: now, validFrom: now });
  value.episodic.push({ id: "ep-1", kind: "episodic", text: "Adam previous appointment", tags: ["Adam", "appointment"], recordedAt: now, validFrom: now });
  value.procedural.push({ id: "proc-1", kind: "procedural", text: "confirm appointment before closing", tags: ["appointment", "confirm"], recordedAt: now, validFrom: now });
  value.holographic.push({ id: "holo-1", kind: "holographic", text: "Adam appointment receptionist conversation", tags: ["Adam", "reception"], recordedAt: now, validFrom: now });
  value.bitemporal!.push({ id: "bt-1", kind: "semantic", text: "slot 11:30 prepared", tags: ["slot", "11:30"], recordedAt: now, validFrom: "2026-09-14T09:00:00.000Z", version: 3, source: "prepared-availability", confidence: 1, authority: "authoritative", verified: true });
  value.graph!.push({ from: "ep-1", to: "holo-1", relation: "related-to" });
  return value;
}

describe("seven-dimensional memory fabric", () => {
  it("keeps semantic, episodic and temporal retrieval distinct", () => { const value = fabric(); expect(semanticRetrieve("first visit", value)[0]?.id).toBe("sem-1"); expect(temporalRetrieve("2026-09-14T10:00:00.000Z", value)[0]?.id).toBe("bt-1"); });
  it("retrieves working memory as a first-class dimension", () => { const value = fabric(); expect(workingRetrieve("Adam appointment", value)[0]?.id).toBe("work-1"); });
  it("uses graph links to expand associative retrieval", () => { const value = fabric(); expect(graphRetrieve("Adam previous appointment", value).map((item) => item.id)).toEqual(expect.arrayContaining(["ep-1", "holo-1"])); expect(holographicRetrieve("Adam receptionist", value)[0]?.id).toBe("holo-1"); });
  it("assembles whole-memory context across the seven dimensions without turning retrieval into authority", () => { const value = fabric(); const retrieved = retrieveWholeMemory("Adam appointment first visit", value); const ids = retrieved.map((item) => item.id); expect(ids).toEqual(expect.arrayContaining(["work-1", "sem-1", "ep-1", "proc-1", "holo-1", "bt-1"])); const provenance = provenanceForBitemporalMemory(value.bitemporal![0]!, now); expect(provenance.verified).toBe(true); expect(memoryCanAuthorizeExecution(provenance)).toBe(false); });
});
