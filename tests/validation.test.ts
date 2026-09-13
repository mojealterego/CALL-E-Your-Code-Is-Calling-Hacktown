import { describe, expect, it } from "vitest";
import { validateOutcome } from "../src/validation.js";

describe("outcome validation", () => {
  it("accepts a fully specified outcome", () => {
    expect(validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed the diversion and ETA 16:40.",
      confidence: "high",
    }).confidence).toBe("high");
  });

  it("accepts current CALL-E completion confidence", () => {
    const outcome = validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed the diversion and ETA 16:40.",
      confidence: "high",
      task_completed: true,
      completion_confidence: { score: 0.92, label: "high" },
      evidence: ["Driver accepted Route B."],
    });
    expect(outcome.task_completed).toBe(true);
    expect(outcome.evidence).toEqual(["Driver accepted Route B."]);
  });

  it("accepts the complete appointment result contract", () => {
    const outcome = validateOutcome({
      patient_confirmed: "yes",
      appointment_confirmed: "yes",
      doctor_confirmed: "doktor Pawlak",
      first_visit: "no",
      identity_document_reminder_given: false,
      arrive_30_minutes_early: false,
      registration_reminder_given: false,
      information_form_reminder_given: false,
      conversation_completed: true,
      appointment_decision: "confirm",
      reschedule_requested: false,
      reschedule_completed: false,
      new_appointment_date: "",
      new_appointment_time: "",
      evidence_summary: "Adam confirmed the appointment and said he had visited before.",
      confidence: "high",
    });
    expect(outcome.patient_confirmed).toBe("yes");
    expect(outcome.appointment_decision).toBe("confirm");
  });

  it("rejects appointment evidence without explicit patient identity", () => {
    expect(() => validateOutcome({
      appointment_confirmed: "yes",
      doctor_confirmed: "doktor Pawlak",
      first_visit: "no",
      identity_document_reminder_given: false,
      arrive_30_minutes_early: false,
      registration_reminder_given: false,
      information_form_reminder_given: false,
      conversation_completed: true,
      appointment_decision: "confirm",
      reschedule_requested: false,
      reschedule_completed: false,
      new_appointment_date: "",
      new_appointment_time: "",
      evidence_summary: "Appointment confirmed.",
      confidence: "high",
    })).toThrow();
  });

  it("rejects missing evidence", () => {
    expect(() => validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "",
      confidence: "high",
    })).toThrow();
  });

  it("rejects unknown enum values", () => {
    expect(() => validateOutcome({
      route: "B",
      route_acceptance: "maybe",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed.",
      confidence: "high",
    })).toThrow();
  });
});
