import { describe, expect, it } from "vitest";
import { createClaim } from "./assurance.js";
import { runCognitiveAssuranceStack } from "./cognitive-assurance-stack.js";

const base = {
  patientName: "Adam Miauczyński",
  doctorName: "Pawlak",
  appointmentDate: "2026-09-15",
  appointmentTime: "14:00",
  appointmentDecision: "confirm",
  patientConfirmed: "yes",
  providerStatus: "completed",
  taskCompleted: true,
  conversationCompleted: true,
  evidenceItems: ["call_1", "turn_17", "structured_result"],
  evidenceSummary: "patient confirmed appointment with doctor Pawlak",
};

function claims() {
  return [
    createClaim({ subject: "patient", predicate: "patient.confirmed", value: "yes", status: "verified", source: "authoritative", evidenceRefs: ["call_1"], confidence: 1, validFrom: "2026-09-14T00:00:00.000Z" }),
    createClaim({ subject: "appointment", predicate: "appointment.confirmed", value: "yes", status: "verified", source: "authoritative", evidenceRefs: ["call_1"], confidence: 1, validFrom: "2026-09-14T00:00:00.000Z" }),
    createClaim({ subject: "appointment", predicate: "appointment.decision", value: "confirm", status: "verified", source: "authoritative", evidenceRefs: ["call_1"], confidence: 1, validFrom: "2026-09-14T00:00:00.000Z" }),
    createClaim({ subject: "appointment", predicate: "appointment.doctor", value: "Pawlak", status: "verified", source: "authoritative", evidenceRefs: ["call_1"], confidence: 1, validFrom: "2026-09-14T00:00:00.000Z" }),
    createClaim({ subject: "conversation", predicate: "conversation.completed", value: "yes", status: "verified", source: "authoritative", evidenceRefs: ["call_1"], confidence: 1, validFrom: "2026-09-14T00:00:00.000Z" }),
  ];
}

describe("cognitive assurance stack", () => {
  it("allows a fully verified commit through the assurance boundary", () => {
    const result = runCognitiveAssuranceStack({ ...base, claims: claims(), decision: "commit", trajectory: [{ type: "observation", detail: "identity verified", safe: true }, { type: "side_effect", detail: "one bounded call", safe: true }], parserInterpretations: [{ name: "parser-a", claims: claims() }] });
    expect(result.formal.allowed).toBe(true);
    expect(result.trajectory.safe).toBe(true);
    expect(result.executionAllowed).toBe(true);
    expect(result.contract.digest).toHaveLength(64);
  });

  it("fails closed when the trajectory contains a disclosure after identity failure", () => {
    const result = runCognitiveAssuranceStack({ ...base, claims: claims(), decision: "commit", trajectory: [{ type: "observation", detail: "identity rejected", safe: true }, { type: "side_effect", detail: "appointment disclosed", safe: false }], parserInterpretations: [{ name: "parser-a", claims: claims() }] });
    expect(result.trajectory.safe).toBe(false);
    expect(result.trajectory.violations).toContain("disclosure-after-identity-failure");
    expect(result.executionAllowed).toBe(false);
  });

  it("routes disagreement to recovery rather than treating consensus as proof", () => {
    const a = claims();
    const b = claims().map((claim) => ({ ...claim, value: claim.predicate === "appointment.decision" ? "cancel" : claim.value }));
    const result = runCognitiveAssuranceStack({ ...base, claims: a, decision: "commit", trajectory: [], parserInterpretations: [{ name: "parser-a", claims: a }, { name: "parser-b", claims: b }] });
    expect(result.compound.action).toBe("recover");
    expect(result.executionAllowed).toBe(false);
  });
});
