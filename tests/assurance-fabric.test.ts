import { describe, expect, it } from "vitest";
import { buildClaimLedger, buildConversationContract, buildEvidenceGraph, classifyClaim, compoundReasoning, conserveExternalSideEffect, evaluateTrajectory, reconcileStaleState, scoreMonitorability } from "../src/assurance-fabric.js";
import type { Incident } from "../src/domain.js";

const incident: Incident = { id: "i-1", vehicleId: "v-1", phone: "test-phone", closure: "appointment", requestedBy: "patient-1", goal: "confirm appointment" };
const good = { route_acceptance: "yes" as const, eta_update_time: "11:30", escalation_needed: "none" as const, evidence_summary: "provider confirmed appointment", confidence: "high" as const };

describe("real-world assurance fabric", () => {
  it("builds a tamper-evident conversation contract", () => {
    const c = buildConversationContract(incident);
    expect(c.objective.confirmAppointment).toBe(true);
    expect(c.forbiddenActions).toContain("invent_availability");
    expect(c.commitConditions).toContain("no_conflicts");
    expect(c.digest).toHaveLength(64);
  });
  it("keeps conversational claims distinct from verified claims", () => {
    const ledger = buildClaimLedger(good, "call-1", "2026-09-14T05:00:00.000Z");
    expect(ledger.claims.every(c => c.status === "TRUE")).toBe(true);
    const uncertain = buildClaimLedger({ ...good, confidence: "medium", evidence_summary: "ambiguous" }, "call-2");
    expect(uncertain.commitAllowed).toBe(false);
    expect(uncertain.claims.some(c => c.status === "UNVERIFIED")).toBe(true);
  });
  it("constructs an evidence graph from provenance", () => {
    const graph = buildEvidenceGraph(buildClaimLedger(good, "call-1"));
    expect(graph.nodes.length).toBe(4);
    expect(graph.edges.every(e => e.from === graph.root)).toBe(true);
  });
  it("reduces authority as monitorability falls", () => {
    const highLedger = buildClaimLedger(good);
    const high = scoreMonitorability(highLedger, buildEvidenceGraph(highLedger));
    const lowLedger = buildClaimLedger({ ...good, confidence: "low", evidence_summary: "" });
    const low = scoreMonitorability(lowLedger, buildEvidenceGraph(lowLedger));
    expect(high.overall).toBeGreaterThan(low.overall);
    expect(low.action).toBe("recover / human review");
  });
  it("rejects unsafe trajectories, including retry after side effect", () => {
    const result = evaluateTrajectory([
      { type: "observation", detail: "call started", safe: true },
      { type: "state_update", detail: "identity mismatch", safe: false },
      { type: "side_effect", detail: "provider change", safe: true },
      { type: "retry", detail: "blind retry", safe: true },
    ]);
    expect(result.safe).toBe(false);
    expect(result.violations).toContain("retry-after-side-effect");
  });
  it("uses post-call compound reasoning as a signal, never majority proof", () => {
    const a = buildClaimLedger(good).claims;
    const b = buildClaimLedger(good).claims;
    const disagree = buildClaimLedger({ ...good, eta_update_time: "11:45" }).claims;
    expect(compoundReasoning([{ name: "A", claims: a }, { name: "B", claims: b }]).action).toBe("confidence-signal");
    expect(compoundReasoning([{ name: "A", claims: a }, { name: "B", claims: disagree }]).action).toBe("recover");
  });
  it("models unknown, unverified, stale and contradicted as distinct states", () => {
    expect(classifyClaim("x", [], false, true, false)).toBe("UNKNOWN");
    expect(classifyClaim("x", ["call"], false, true, false)).toBe("UNVERIFIED");
    expect(classifyClaim("x", ["old"], false, false, false)).toBe("STALE");
    expect(classifyClaim("x", ["a", "b"], true, true, true)).toBe("CONTRADICTED");
  });
  it("fails closed when prepared availability is stale", () => {
    expect(reconcileStaleState({ slot: "11:30", slotVersion: 4, stateVersion: 8, preparedAt: "2026-09-14T05:00:00Z" }, { slot: "11:30", slotVersion: 4, stateVersion: 8, readbackAt: "2026-09-14T05:04:00Z" }).action).toBe("COMMIT");
    expect(reconcileStaleState({ slot: "11:30", slotVersion: 4, stateVersion: 8, preparedAt: "2026-09-14T05:00:00Z" }, { slot: "11:30", slotVersion: 5, stateVersion: 9, readbackAt: "2026-09-14T05:04:00Z" }).status).toBe("STALE");
  });
  it("enforces the Side-Effect Conservation Invariant", () => {
    expect(conserveExternalSideEffect(undefined, true).action).toBe("EXECUTE_ONCE");
    expect(conserveExternalSideEffect("call-1", true).action).toBe("RECONCILE_EXISTING");
    expect(conserveExternalSideEffect(undefined, false).allowed).toBe(false);
  });
});
