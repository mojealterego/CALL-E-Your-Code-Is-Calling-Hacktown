import { describe, expect, it } from "vitest";
import { buildAssuranceContext, formalGate, semanticRag } from "./assurance.js";

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
    expect(context.claims).toHaveLength(4);
    expect(context.thoughts).toHaveLength(4);
    expect(context.bitemporalFacts.every((fact) => fact.version > 0)).toBe(true);
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
