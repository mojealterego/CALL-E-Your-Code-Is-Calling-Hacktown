import { describe, expect, it } from "vitest";
import { prepareAppointmentTransaction, reconcileAppointmentTransaction } from "../src/transaction.js";

const tx = prepareAppointmentTransaction({
  transactionId: "TX-APPT-001",
  incidentId: "APPT-001",
  participantId: "PATIENT-ADAM-MIAUCZYNSKI",
  constraints: {
    clinicName: "Przychodnia Medica Nova",
    patientName: "Adam Miauczyński",
    doctorName: "doktor Pawlak",
    appointmentReference: "TOMORROW-APPOINTMENT-001",
    appointmentDate: "2026-09-14",
    appointmentTime: "10:00",
    availableSlots: [
      { date: "2026-09-15", time: "09:00" },
      { date: "2026-09-15", time: "11:30" },
      { date: "2026-09-16", time: "08:30" },
    ],
  },
});

const base = {
  route: "",
  eta: "",
  acceptance: "unknown" as const,
  confidence: "high" as const,
  evidenceSummary: "Adam clearly stated his decision.",
  evidenceItems: ["Adam clearly stated his decision."],
  taskCompleted: true,
  providerStatus: "completed" as const,
  patientConfirmed: "yes" as const,
  doctorConfirmed: "doktor Pawlak",
  conversationCompleted: true,
};

describe("appointment transaction reconciliation", () => {
  it("commits a first-visit confirmation only when all first-visit instructions were given", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "yes",
      appointmentDecision: "confirm",
      firstVisit: "yes",
      identityDocumentReminderGiven: true,
      arrive30MinutesEarly: true,
      registrationReminderGiven: true,
      informationFormReminderGiven: true,
    });
    expect(result.decision).toBe("commit");
  });

  it("commits a non-first-visit confirmation without requiring first-visit instructions", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "yes",
      appointmentDecision: "confirm",
      firstVisit: "no",
      identityDocumentReminderGiven: false,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
    });
    expect(result.decision).toBe("commit");
  });

  it("blocks a non-first-visit result that falsely reports first-visit instructions", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "yes",
      appointmentDecision: "confirm",
      firstVisit: "no",
      identityDocumentReminderGiven: true,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
    });
    expect(result.decision).toBe("abort");
    expect(result.reasons).toContain("first-visit instructions were reported for a non-first visit");
  });

  it("commits a reschedule only to a prepared available slot", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "no",
      appointmentDecision: "reschedule",
      rescheduleRequested: true,
      rescheduleCompleted: true,
      firstVisit: "no",
      identityDocumentReminderGiven: false,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
      newAppointmentDate: "2026-09-15",
      newAppointmentTime: "11:30",
    });
    expect(result.decision).toBe("commit");
  });

  it("aborts when Adam explicitly says he no longer wants the appointment", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "no",
      appointmentDecision: "cancel",
      rescheduleRequested: false,
      rescheduleCompleted: false,
      firstVisit: "unknown",
      identityDocumentReminderGiven: false,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
    });
    expect(result.decision).toBe("abort");
  });

  it("recovers when identity is not established", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      patientConfirmed: "unknown",
      appointmentConfirmed: "unknown",
      appointmentDecision: "unknown",
      firstVisit: "unknown",
      identityDocumentReminderGiven: false,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
    });
    expect(result.decision).toBe("recover");
  });

  it("recovers when Adam wants to reschedule but no valid slot was accepted", () => {
    const result = reconcileAppointmentTransaction(tx, {
      ...base,
      appointmentConfirmed: "no",
      appointmentDecision: "reschedule",
      rescheduleRequested: true,
      rescheduleCompleted: false,
      firstVisit: "no",
      identityDocumentReminderGiven: false,
      arrive30MinutesEarly: false,
      registrationReminderGiven: false,
      informationFormReminderGiven: false,
      newAppointmentDate: "",
      newAppointmentTime: "",
    });
    expect(result.decision).toBe("abort");
  });
});
