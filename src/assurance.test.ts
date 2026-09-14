import { describe, expect, it } from "vitest";
import {
  buildAssuranceContext,
  buildClaimLedger,
  buildConversationContract,
  compoundReasoning,
  conserveExternalSideEffect,
  formalGate,
  reconcileStaleState,
  scoreMonitorability,
  evaluateTrajectory,
  createClaim,
} from "./assurance.js";
import { rebuildLedgerAfterVerification, verifyClaim } from "./claim-ledger.js";

describe("cognitive assurance fabric", () => {
  it("retrieves semantic procedural memory deterministically", () => {
    const context = buildAssuranceContext({
      patientName: "Adam Miauczyński",
      doctorName: "Pawlak",
      appointmentDate: "2026-09-15",
      appointmentTime: "14:00",
      appointmentDecision: "confirm",
      patientConfirmed: "yes",
      evidenceSummary: "Adam confirmed the appointment.",
      firstVisit: "yes",
    });
    expect(context.retrievedMemory.length).toBeGreaterThan(0);
    expect(context.retrievedMemory.some((item) => item.tags.includes("first visit"))).toBe(true);
  });

  it("builds a graph of claims rather than collapsing them into one answer", () => {
    const context = buildAssuranceContext({
      patientName: "Adam Miauczyński",
      doctorName: "Pawlak",
      appointmentDate: "2026-09-15",
      appointmentTime: "14:00",
      appointmentDecision: "confirm",
      patientConfirmed: "yes",
      evidenceSummary: "Identity confirmed.",
      firstVisit: "no",
    });
    expect(context.claims).toHaveLength(6);
    expect(context.thoughts).toHaveLength(6);
    expect(context.evidenceGraph.nodes.length).toBe(7);
    expect(context.evidenceGraph.edges).toHaveLength(6);
    expect(context.bitemporalFacts.every((fact) => fact.version > 0)).toBe(true);
  });

  it("keeps conversational claims unverified until an authoritative source verifies them", () => {
    const claim = createClaim({
      subject: "Adam Miauczyński",
      predicate: "appointment.confirmed",
      value: "yes",
      status: "unverified",
      source: "call-e",
      authority: "conversational",
      evidenceRefs: ["call_id:demo", "conversation_turn:12", "structured_result"],
      confidence: 1,
      validFrom: "2026-09-14T00:00:00.000Z",
      provenance: ["call-e", "structured_result"],
    });
    const ledger = buildClaimLedger([claim]);
    expect(ledger.commitAllowed).toBe(false);
    expect(ledger.verified).toHaveLength(0);
    expect(claim.status).toBe("unverified");
  });

  it("promotes a claim only through an explicit authoritative verification", () => {
    const claim = createClaim({
      subject: "Adam Miauczyński",
      predicate: "appointment.confirmed",
      value: "yes",
      status: "unverified",
      source: "call-e",
      authority: "conversational",
      evidenceRefs: ["call_id:demo", "conversation_turn:12", "structured_result"],
      confidence: 1,
      validFrom: "2026-09-14T00:00:00.000Z",
      provenance: ["call-e", "structured_result"],
    });
    const verified = verifyClaim(claim, { source: "authoritative", value: "yes", evidenceRefs: ["calendar-readback:v3"], fresh: true });
    expect(verified.decision.verified).toBe(true);
    expect(verified.claim.status).toBe("verified");
    expect(verified.claim.authority).toBe("authoritative");
    expect(verified.claim.provenance).toContain("calendar-readback:v3");

    const conflict = verifyClaim(claim, { source: "authoritative", value: "no", evidenceRefs: ["calendar-readback:v4"], fresh: true });
    expect(conflict.decision.status).toBe("contradicted");
    expect(conflict.claim.status).toBe("contradicted");

    const rebuilt = rebuildLedgerAfterVerification([verified.claim]);
    expect(rebuilt.commitAllowed).toBe(false);
  });

  it("treats monitorability as a safety variable", () => {
    const context = buildAssuranceContext({
      patientName: "Adam Miauczyński",
      doctorName: "Pawlak",
      appointmentDate: "2026-09-15",
      appointmentTime: "14:00",
      appointmentDecision: "confirm",
      patientConfirmed: "yes",
      evidenceSummary: "partial evidence",
    });
    expect(context.monitorability.overall).toBeLessThan(0.9);
    expect(context.monitorability.action).not.toBe("normal reconciliation");
    expect(scoreMonitorability(context.claimLedger).overall).toBe(context.monitorability.overall);
  });

  it("detects trajectory violations instead of judging events in isolation", () => {
    const result = evaluateTrajectory([
      { type: "observation", detail: "wrong identity", safe: true },
      { type: "state_update", detail: "identity rejected", safe: true },
      { type: "model_output", detail: "appointment disclosed", safe: true },
    ]);
    expect(result.safe).toBe(false);
    expect(result.violations).toContain("disclosure-after-identity-failure");
  });

  it("blocks a retry after an external side effect, enforcing side-effect conservation", () => {
    const result = evaluateTrajectory([
      { type: "observation", detail: "CALL-E state is unknown", safe: true },
      { type: "side_effect", detail: "outbound phone call placed", safe: true },
      { type: "retry", detail: "attempt another phone call", safe: false },
    ]);
    expect(result.safe).toBe(false);
    expect(result.violations).toContain("retry-after-side-effect");
    expect(conserveExternalSideEffect("call-existing-001", true)).toEqual({ allowed: false, action: "reconcile_existing" });
  });

  it("allows compound reasoning to raise confidence but forces recovery on disagreement", () => {
    const base = createClaim({ subject: "Adam", predicate: "appointment.decision", value: "confirm", status: "unverified", source: "call-e", evidenceRefs: ["call"], confidence: 0.8, validFrom: "2026-09-14T00:00:00.000Z" });
    const agree = compoundReasoning([{ name: "parser-a", claims: [base] }, { name: "parser-b", claims: [{ ...base, id: "b" }] }]);
    expect(agree.action).toBe("confidence-signal");
    const disagree = compoundReasoning([{ name: "parser-a", claims: [base] }, { name: "parser-b", claims: [{ ...base, id: "b", value: "cancel" }] }]);
    expect(disagree.action).toBe("recover");
  });

  it("treats stale prepared state as recover, never as a silent commit", () => {
    expect(reconcileStaleState(
      { slot: "2026-09-15T11:30", slotVersion: 1, stateVersion: 4, preparedAt: "2026-09-14T00:00:00.000Z" },
      { slot: "2026-09-15T11:30", slotVersion: 2, stateVersion: 5, readbackAt: "2026-09-14T00:04:00.000Z" },
    )).toEqual({ status: "stale", action: "recover" });
  });

  it("conserves external side effects when execution state is uncertain", () => {
    expect(conserveExternalSideEffect("call-123", true)).toEqual({ allowed: false, action: "reconcile_existing" });
    expect(conserveExternalSideEffect(undefined, true)).toEqual({ allowed: true, action: "execute_once" });
  });

  it("builds a conversation contract with conditional first-visit evidence", () => {
    const contract = buildConversationContract("Adam Miauczyński");
    expect(contract.allowedActions).toEqual(["confirm", "reschedule", "cancel"]);
    expect(contract.conditionalEvidence.firstVisitYes).toContain("identity_document_reminder");
    expect(contract.conditionalEvidence.firstVisitNo).toHaveLength(0);
    expect(contract.forbiddenActions).toContain("disclose_before_identity");
    expect(contract.digest).toHaveLength(64);
  });

  it("blocks commit when identity or authoritative completion is missing", () => {
    const result = formalGate({
      decision: "commit",
      patientConfirmed: "unknown",
      providerStatus: "in_progress",
      taskCompleted: false,
      conversationCompleted: true,
      evidenceItems: ["partial"],
    });
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain("INVARIANT_IDENTITY_VERIFIED");
    expect(result.violations).toContain("INVARIANT_PROVIDER_TERMINAL");
  });

  it("requires prepared availability for reschedule commit", () => {
    const result = formalGate({
      decision: "commit",
      patientConfirmed: "yes",
      appointmentDecision: "reschedule",
      providerStatus: "completed",
      taskCompleted: true,
      conversationCompleted: true,
      evidenceItems: ["accepted replacement slot"],
      selectedSlotPrepared: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain("INVARIANT_SLOT_PREPARED");
  });
});
