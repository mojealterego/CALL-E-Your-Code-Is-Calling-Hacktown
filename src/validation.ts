import type { CallOutcome, CompletionConfidence } from "./domain.js";

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

export function validateOutcome(value: unknown): CallOutcome {
  if (!value || typeof value !== "object") throw new Error("CALL-E result must be an object");
  const v = value as Record<string, unknown>;
  const appointmentResult = v.appointment_confirmed !== undefined || v.first_visit !== undefined || v.doctor_confirmed !== undefined || v.appointment_decision !== undefined;
  if (appointmentResult) {
    if (!APPOINTMENT.has(String(v.appointment_confirmed))) throw new Error("Invalid appointment_confirmed");
    if (typeof v.doctor_confirmed !== "string") throw new Error("Invalid doctor_confirmed");
    if (!APPOINTMENT.has(String(v.first_visit))) throw new Error("Invalid first_visit");
    for (const key of ["identity_document_reminder_given", "arrive_30_minutes_early", "registration_reminder_given", "information_form_reminder_given", "conversation_completed", "reschedule_requested", "reschedule_completed"]) {
      if (typeof v[key] !== "boolean") throw new Error(`Invalid ${key}`);
    }
    if (!APPOINTMENT_DECISION.has(String(v.appointment_decision))) throw new Error("Invalid appointment_decision");
    if (typeof v.new_appointment_date !== "string" || typeof v.new_appointment_time !== "string") throw new Error("Invalid rescheduled appointment");
    if (typeof v.evidence_summary !== "string" || v.evidence_summary.trim().length === 0) throw new Error("Evidence is required");
    if (!CONFIDENCE.has(String(v.confidence))) throw new Error("Invalid confidence");
    return {
      route: "", route_acceptance: "unknown", eta_update_time: "", escalation_needed: "none",
      evidence_summary: v.evidence_summary, confidence: v.confidence as CallOutcome["confidence"],
      appointment_confirmed: v.appointment_confirmed as CallOutcome["appointment_confirmed"], doctor_confirmed: v.doctor_confirmed,
      first_visit: v.first_visit as CallOutcome["first_visit"], identity_document_reminder_given: v.identity_document_reminder_given,
      arrive_30_minutes_early: v.arrive_30_minutes_early, registration_reminder_given: v.registration_reminder_given,
      information_form_reminder_given: v.information_form_reminder_given, conversation_completed: v.conversation_completed,
      appointment_decision: v.appointment_decision as CallOutcome["appointment_decision"],
      reschedule_requested: v.reschedule_requested, reschedule_completed: v.reschedule_completed,
      new_appointment_date: v.new_appointment_date, new_appointment_time: v.new_appointment_time,
      ...(Array.isArray(v.evidence) ? { evidence: v.evidence.filter((item): item is string => typeof item === "string") } : {}),
      ...(v.task_completed !== undefined ? { task_completed: v.task_completed as boolean } : {}),
      ...(v.completion_confidence !== undefined ? { completion_confidence: validateCompletionConfidence(v.completion_confidence) } : {}),
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
