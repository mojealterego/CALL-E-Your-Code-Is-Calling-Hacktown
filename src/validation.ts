import type { CallOutcome, CompletionConfidence, AppointmentConfirmation } from "./domain.js";

const ROUTE_ACCEPTANCE = new Set(["yes", "no", "unknown"]);
const ESCALATION = new Set(["urgent", "normal", "none", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const APPOINTMENT = new Set(["yes", "no", "unknown"]);
const APPOINTMENT_DECISION = new Set(["confirm", "reschedule", "cancel", "unknown"]);

function validateCompletionConfidence(value: unknown): CompletionConfidence | string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") throw new Error("Invalid completion_confidence");
  const v = value as Record<string, unknown>;
  if (v.score !== undefined && (typeof v.score !== "number" || v.score < 0 || v.score > 1)) throw new Error("Invalid completion_confidence score");
  if (v.label !== undefined && typeof v.label !== "string") throw new Error("Invalid completion_confidence label");
  return { ...(v.score !== undefined ? { score: v.score } : {}), ...(v.label !== undefined ? { label: v.label } : {}) };
}

function validateAppointmentField(value: unknown, key: string): AppointmentConfirmation {
  if (!APPOINTMENT.has(String(value))) throw new Error(`Invalid ${key}`);
  return value as AppointmentConfirmation;
}

export function validateOutcome(value: unknown): CallOutcome {
  if (!value || typeof value !== "object") throw new Error("CALL-E result must be an object");
  const v = value as Record<string, unknown>;
  const appointmentResult = v.patient_confirmed !== undefined || v.appointment_confirmed !== undefined || v.first_visit !== undefined || v.doctor_confirmed !== undefined || v.appointment_decision !== undefined;
  if (appointmentResult) {
    const patientConfirmed = validateAppointmentField(v.patient_confirmed, "patient_confirmed");
    const appointmentConfirmed = validateAppointmentField(v.appointment_confirmed, "appointment_confirmed");
    const firstVisit = validateAppointmentField(v.first_visit, "first_visit");
    if (typeof v.doctor_confirmed !== "string") throw new Error("Invalid doctor_confirmed");
    const doctorConfirmed = v.doctor_confirmed;
    const booleanField = (key: string): boolean => {
      const field = v[key];
      if (typeof field !== "boolean") throw new Error(`Invalid ${key}`);
      return field;
    };
    const identityDocumentReminderGiven = booleanField("identity_document_reminder_given");
    const arrive30MinutesEarly = booleanField("arrive_30_minutes_early");
    const registrationReminderGiven = booleanField("registration_reminder_given");
    const informationFormReminderGiven = booleanField("information_form_reminder_given");
    const conversationCompleted = booleanField("conversation_completed");
    const rescheduleRequested = booleanField("reschedule_requested");
    const rescheduleCompleted = booleanField("reschedule_completed");
    if (!APPOINTMENT_DECISION.has(String(v.appointment_decision))) throw new Error("Invalid appointment_decision");
    const appointmentDecision = v.appointment_decision as CallOutcome["appointment_decision"];
    if (typeof v.new_appointment_date !== "string" || typeof v.new_appointment_time !== "string") throw new Error("Invalid rescheduled appointment");
    const newAppointmentDate = v.new_appointment_date;
    const newAppointmentTime = v.new_appointment_time;
    if (typeof v.evidence_summary !== "string" || v.evidence_summary.trim().length === 0) throw new Error("Evidence is required");
    const evidenceSummary = v.evidence_summary;
    if (!CONFIDENCE.has(String(v.confidence))) throw new Error("Invalid confidence");
    const confidence = v.confidence as CallOutcome["confidence"];
    const completionConfidence = validateCompletionConfidence(v.completion_confidence);
    return {
      route: "", route_acceptance: "unknown", eta_update_time: "", escalation_needed: "none",
      evidence_summary: evidenceSummary, confidence,
      patient_confirmed: patientConfirmed,
      appointment_confirmed: appointmentConfirmed,
      doctor_confirmed: doctorConfirmed,
      first_visit: firstVisit,
      identity_document_reminder_given: identityDocumentReminderGiven,
      arrive_30_minutes_early: arrive30MinutesEarly,
      registration_reminder_given: registrationReminderGiven,
      information_form_reminder_given: informationFormReminderGiven,
      conversation_completed: conversationCompleted,
      appointment_decision: appointmentDecision,
      reschedule_requested: rescheduleRequested,
      reschedule_completed: rescheduleCompleted,
      new_appointment_date: newAppointmentDate,
      new_appointment_time: newAppointmentTime,
      ...(Array.isArray(v.evidence) ? { evidence: v.evidence.filter((item): item is string => typeof item === "string") } : {}),
      ...(v.task_completed !== undefined ? { task_completed: v.task_completed as boolean } : {}),
      ...(completionConfidence !== undefined ? { completion_confidence: completionConfidence } : {}),
      ...(typeof v.failure_code === "string" ? { failure_code: v.failure_code } : {}),
      ...(typeof v.failure_message === "string" ? { failure_message: v.failure_message } : {}),
    };
  }

  if (typeof v.route !== "string") throw new Error("Invalid route");
  if (!ROUTE_ACCEPTANCE.has(String(v.route_acceptance))) throw new Error("Invalid route_acceptance");
  if (!ESCALATION.has(String(v.escalation_needed))) throw new Error("Invalid escalation_needed");
  if (!CONFIDENCE.has(String(v.confidence))) throw new Error("Invalid confidence");
  if (typeof v.eta_update_time !== "string") throw new Error("Invalid eta_update_time");
  if (typeof v.evidence_summary !== "string" || v.evidence_summary.trim().length === 0) throw new Error("Evidence is required");
  if (v.evidence !== undefined && (!Array.isArray(v.evidence) || v.evidence.some((item) => typeof item !== "string"))) throw new Error("Invalid evidence");
  if (v.task_completed !== undefined && typeof v.task_completed !== "boolean") throw new Error("Invalid task_completed");
  const completionConfidence = validateCompletionConfidence(v.completion_confidence);
  return {
    route: v.route, route_acceptance: v.route_acceptance as CallOutcome["route_acceptance"], eta_update_time: v.eta_update_time,
    escalation_needed: v.escalation_needed as CallOutcome["escalation_needed"], evidence_summary: v.evidence_summary,
    ...(v.evidence !== undefined ? { evidence: v.evidence as string[] } : {}), confidence: v.confidence as CallOutcome["confidence"],
    ...(v.task_completed !== undefined ? { task_completed: v.task_completed } : {}),
    ...(completionConfidence !== undefined ? { completion_confidence: completionConfidence } : {}),
    ...(typeof v.failure_code === "string" ? { failure_code: v.failure_code } : {}), ...(typeof v.failure_message === "string" ? { failure_message: v.failure_message } : {}),
  };
}
