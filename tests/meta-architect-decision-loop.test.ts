import { describe, expect, it } from "vitest";
import { createClaim, type Claim, type TrajectoryEvent } from "../src/assurance.js";
import { adversarialDecisionChecks, buildCapabilityAdapter, buildDecisionReceipt, buildFailureMemory, clarifyAppointmentResponse, classifyAutonomy, decisionMatrix, negotiatePreparedOptions, runMetaArchitectDecisionLoop, scoreRiskConfidence, trajectoryMetrics } from "../src/meta-architect-decision-loop.js";

const now = "2026-09-14T06:00:00.000Z";
function claim(predicate: string, value: string, id: string): Claim { return createClaim({ subject: "Adam Miauczyński", predicate, value, status: "verified", source: "authoritative", authority: "authoritative", evidenceRefs: [id], confidence: 1, validFrom: now }); }
const claims = [
  claim("patient.confirmed", "yes", "identity"),
  claim("appointment.confirmed", "yes", "appointment"),
  claim("appointment.decision", "confirm", "decision"),
  claim("appointment.doctor", "dr Pawlak", "doctor"),
  claim("conversation.completed", "true", "completion"),
];
const safeTrajectory: TrajectoryEvent[] = [
  { type: "observation", detail: "identity verified", safe: true },
  { type: "state_update", detail: "appointment confirmed", safe: true },
  { type: "side_effect", detail: "commit appointment", safe: true },
];

describe("Meta-Architect Decision Loop", () => {
  it("negotiates only prepared options and never invents a slot", () => {
    const options = [{ id: "s1", date: "2026-09-15", time: "09:00", prepared: true, preferenceScore: 0.9, riskScore: 0.1 }, { id: "s2", date: "2026-09-15", time: "11:30", prepared: true, preferenceScore: 0.8, riskScore: 0.1 }];
    expect(negotiatePreparedOptions("2026-09-15", "12:15", options).next?.time).toBe("09:00");
    expect(negotiatePreparedOptions("2026-09-18", "12:15", options).next?.time).toBe("09:00");
    expect(negotiatePreparedOptions("2026-09-18", "12:15", options).status).toBe("clarify");
    expect(clarifyAppointmentResponse("11:30", ["2026-09-15"], ["11:30"]).value).toBe("11:30");
  });
  it("fails closed when a formal prerequisite is missing", () => {
    expect(decisionMatrix({ identityVerified: true, appointmentVerified: true, providerTerminal: true, taskCompleted: true, conversationCompleted: true, evidencePresent: true, noContradiction: false, slotPrepared: true, trajectorySafe: true }).action).toBe("recover");
    expect(adversarialDecisionChecks({ identityVerified: false, appointmentVerified: false, slotPrepared: false, stateFresh: false, callKnown: false, evidencePresent: false, contradiction: true, authoritativeReadback: false })).toHaveLength(8);
  });
  it("classifies autonomy from observed degradation", () => {
    expect(classifyAutonomy({ failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateAttemptRate: 0, confidence: 1, latencyMs: 20 })).toBe("normal");
    expect(classifyAutonomy({ failureRate: 0.2, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateAttemptRate: 0, confidence: 0.9, latencyMs: 20 })).toBe("restricted");
    expect(classifyAutonomy({ failureRate: 0.4, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateAttemptRate: 0, confidence: 0.9, latencyMs: 20 })).toBe("human-review");
  });
  it("keeps trajectory safety and failure memory explicit", () => {
    const events: TrajectoryEvent[] = [...safeTrajectory, { type: "retry", detail: "retry after commit", safe: false }];
    expect(trajectoryMetrics(events)).toMatchObject({ sideEffects: 1, unsafeEvents: 1, retriesAfterSideEffect: 1, safe: false });
    expect(buildFailureMemory({ failureRate: 0.4, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateAttemptRate: 0, confidence: 0.5, latencyMs: 20 }, ["retry-after-side-effect"]).severity).toBe("high");
  });
  it("scores evidence and creates tamper-evident decision receipt", () => {
    const score = scoreRiskConfidence({ evidenceCount: 4, requiredEvidenceCount: 4, contradiction: false, trajectorySafe: true, providerTerminal: true, taskCompleted: true, conversationCompleted: true, selectedSlotPrepared: true });
    expect(score.confidence).toBeGreaterThanOrEqual(0.75); expect(score.risk).toBeLessThan(0.3);
    const receipt = buildDecisionReceipt({ action: "commit", transaction: { tx: "1" }, evidence: { ok: true } });
    expect(receipt.receiptId).toMatch(/^receipt_/); expect(receipt.transactionDigest).toHaveLength(64); expect(receipt.evidenceDigest).toHaveLength(64);
  });
  it("runs the complete commit path only with verified claims and a known capability", () => {
    const capability = buildCapabilityAdapter({ provider: "CALL-E", operation: "appointment-confirmation", participant: "Adam Miauczyński", endpoint: "+48518873940", constraints: ["confirm appointment"] });
    const result = runMetaArchitectDecisionLoop({ intent: "confirm appointment", patientName: "Adam Miauczyński", doctorName: "dr Pawlak", appointmentDate: "2026-09-15", appointmentTime: "09:00", claims, trajectory: safeTrajectory, providerTerminal: true, taskCompleted: true, conversationCompleted: true, patientConfirmed: "yes", appointmentDecision: "confirm", evidenceItems: ["patient identity", "appointment decision", "doctor", "conversation completed"], selectedSlotPrepared: true, contradiction: false, capability });
    expect(result.action).toBe("commit"); expect(result.allowed).toBe(true); expect(result.receipt?.action).toBe("commit");
  });
  it("recovers on contradiction instead of committing", () => {
    const result = runMetaArchitectDecisionLoop({ intent: "confirm appointment", patientName: "Adam Miauczyński", doctorName: "dr Pawlak", appointmentDate: "2026-09-15", appointmentTime: "09:00", claims, trajectory: safeTrajectory, providerTerminal: true, taskCompleted: true, conversationCompleted: true, patientConfirmed: "yes", appointmentDecision: "confirm", evidenceItems: ["patient identity", "appointment decision", "doctor", "conversation completed"], selectedSlotPrepared: true, contradiction: true, capability: buildCapabilityAdapter({ provider: "CALL-E", operation: "appointment-confirmation", participant: "Adam Miauczyński", endpoint: "+48518873940", constraints: ["confirm appointment"] }) });
    expect(result.allowed).toBe(false); expect(result.action).toBe("recover"); expect(result.adversarialChecks.some((x) => x.includes("CONTRADICTION"))).toBe(true);
  });
});
