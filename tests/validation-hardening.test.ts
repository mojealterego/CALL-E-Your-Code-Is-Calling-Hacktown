import { describe, expect, it } from "vitest";
import { validateOutcome } from "../src/validation.js";

describe("structured CALL-E result hardening", () => {
  const appointment = {
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
    evidence_summary: "The patient confirmed the appointment.",
    evidence: ["The patient confirmed the appointment."],
    confidence: "high",
    task_completed: true,
  };

  it("rejects a non-boolean task_completed instead of coercing it", () => {
    expect(() => validateOutcome({ ...appointment, task_completed: "true" })).toThrow("Invalid task_completed");
  });

  it("rejects malformed appointment evidence instead of silently filtering it", () => {
    expect(() => validateOutcome({ ...appointment, evidence: ["valid", 42] })).toThrow("Invalid evidence");
  });

  it("preserves valid terminal appointment evidence", () => {
    const result = validateOutcome(appointment);
    expect(result.task_completed).toBe(true);
    expect(result.evidence).toEqual(["The patient confirmed the appointment."]);
  });
});
