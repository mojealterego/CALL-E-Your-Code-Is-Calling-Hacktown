import { describe, expect, it } from "vitest";
import { createClaim } from "./assurance.js";
import { runCognitiveAssuranceStack } from "./cognitive-assurance-stack.js";
import { emptyMemoryFabric } from "./memory-fabric.js";

const claim = createClaim({
  subject: "patient",
  predicate: "patient.confirmed",
  value: "yes",
  status: "verified",
  source: "authoritative",
  evidenceRefs: ["call_1"],
  confidence: 1,
  validFrom: "2026-09-14T00:00:00.000Z",
});

describe("cognitive memory binding", () => {
  it("makes the complete memory fabric available as context without granting authority", () => {
    const memory = emptyMemoryFabric();
    memory.semantic.push({ id: "semantic-1", kind: "semantic", text: "first visit registration protocol", tags: ["first visit"], recordedAt: "2026-09-14T00:00:00.000Z", validFrom: "2026-09-14T00:00:00.000Z" });
    memory.episodic.push({ id: "episode-1", kind: "episodic", text: "Adam previous appointment", tags: ["Adam"], recordedAt: "2026-09-14T00:00:00.000Z", validFrom: "2026-09-14T00:00:00.000Z" });

    const result = runCognitiveAssuranceStack({
      patientName: "Adam Miauczyński",
      doctorName: "Pawlak",
      appointmentDate: "2026-09-15",
      appointmentTime: "14:00",
      claims: [claim],
      trajectory: [],
      decision: "recover",
      memoryFabric: memory,
      memoryQuery: "Adam first visit appointment",
      parserInterpretations: [],
    });

    expect(result.retrievedMemory.map((item) => item.id)).toEqual(expect.arrayContaining(["semantic-1", "episode-1"]));
    expect(result.executionAllowed).toBe(true);
  });
});
