import type { CallOutcome, Incident } from "./domain.js";
import type { CalleCallStatus } from "./calle.js";
import { AuditLedger } from "./ledger.js";
import { prepareAppointmentTransaction, prepareTransaction, reconcileAppointmentTransaction, reconcileTransaction, type PreparedAppointmentTransaction, type PreparedTransaction } from "./transaction.js";
import { createTransactionReceipt } from "./receipt.js";
import { validateOutcome } from "./validation.js";

export interface AuthoritativeCall {
  id: string;
  status: CalleCallStatus;
  outcome: CallOutcome;
}

function statusOf(value: unknown): CalleCallStatus {
  return value === "queued" || value === "in_progress" || value === "completed" || value === "failed" || value === "canceled"
    ? value
    : "unknown";
}

function outcomeFromAuthoritativeBody(body: Record<string, unknown>, appointment: boolean): CallOutcome {
  const structured = body.structured_result;
  const common = {
    ...(body.task_completed !== null && body.task_completed !== undefined ? { task_completed: body.task_completed } : {}),
    ...(body.completion_confidence !== null && body.completion_confidence !== undefined ? { completion_confidence: body.completion_confidence } : {}),
    ...(Array.isArray(body.evidence) ? { evidence: body.evidence.filter((item): item is string => typeof item === "string") } : {}),
    ...(typeof body.failure_code === "string" ? { failure_code: body.failure_code } : {}),
    ...(typeof body.failure_message === "string" ? { failure_message: body.failure_message } : {}),
  };
  const raw = structured && typeof structured === "object"
    ? { ...(structured as Record<string, unknown>), ...common }
    : appointment
      ? {
          patient_confirmed: "unknown",
          appointment_confirmed: "unknown",
          doctor_confirmed: "",
          first_visit: "unknown",
          identity_document_reminder_given: false,
          arrive_30_minutes_early: false,
          registration_reminder_given: false,
          information_form_reminder_given: false,
          conversation_completed: false,
          appointment_decision: "unknown",
          reschedule_requested: false,
          reschedule_completed: false,
          new_appointment_date: "",
          new_appointment_time: "",
          evidence_summary: typeof body.failure_message === "string" ? body.failure_message : "CALL-E authoritative result is unavailable",
          confidence: "unknown",
          ...common,
        }
      : {
          route: "",
          route_acceptance: "unknown",
          eta_update_time: "",
          escalation_needed: "urgent",
          evidence_summary: typeof body.failure_message === "string" ? body.failure_message : "CALL-E authoritative result is unavailable",
          confidence: "unknown",
          ...common,
        };
  return validateOutcome(raw);
}

export async function fetchAuthoritativeCall(callId: string, apiKey = process.env.CALLE_API_KEY, appointment = false): Promise<AuthoritativeCall> {
  if (!apiKey) throw new Error("CALLE_API_KEY is required for authoritative recovery");
  if (!/^call_[A-Za-z0-9_-]+$/.test(callId)) throw new Error("invalid CALL-E call id");
  const response = await fetch(`https://api.heycall-e.com/v1/calls/${encodeURIComponent(callId)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`CALL-E authoritative fetch failed: HTTP ${response.status}`);
  const body = await response.json() as Record<string, unknown>;
  return { id: callId, status: statusOf(body.status), outcome: outcomeFromAuthoritativeBody(body, appointment) };
}

export async function recoverIncident(
  incident: Incident,
  ledger: AuditLedger,
  apiKey = process.env.CALLE_API_KEY,
) {
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const current = ledger.reserve(operationKey);
  if (current.state !== "recovering") throw new Error(`incident is not recoverable from state ${current.state}`);
  if (!current.callId) throw new Error("cannot recover without an existing CALL-E call id");

  const appointment = incident.appointment;
  const isAppointment = appointment !== undefined;
  const transaction = isAppointment
    ? prepareAppointmentTransaction({ transactionId: current.transactionId ?? `TX-${incident.id}`, incidentId: incident.id, participantId: incident.vehicleId, constraints: appointment })
    : prepareTransaction({ transactionId: current.transactionId ?? `TX-${incident.id}`, incidentId: incident.id, participantId: incident.vehicleId, route: incident.proposedRoute, maxEta: incident.maxEta });

  const authoritative = await fetchAuthoritativeCall(current.callId, apiKey, isAppointment);
  ledger.transition(operationKey, "verifying", { outcome: authoritative.outcome, callId: authoritative.id, transactionId: transaction.transactionId });

  const evidence = {
    route: authoritative.outcome.route,
    eta: authoritative.outcome.eta_update_time,
    acceptance: authoritative.outcome.route_acceptance,
    confidence: authoritative.outcome.confidence,
    evidenceSummary: authoritative.outcome.evidence_summary,
    providerStatus: authoritative.status,
    ...(authoritative.outcome.evidence !== undefined ? { evidenceItems: authoritative.outcome.evidence } : {}),
    ...(authoritative.outcome.task_completed !== undefined ? { taskCompleted: authoritative.outcome.task_completed } : {}),
    ...(authoritative.outcome.completion_confidence !== undefined ? { completionConfidence: authoritative.outcome.completion_confidence } : {}),
    ...(authoritative.outcome.patient_confirmed !== undefined ? { patientConfirmed: authoritative.outcome.patient_confirmed } : {}),
    ...(authoritative.outcome.appointment_confirmed !== undefined ? { appointmentConfirmed: authoritative.outcome.appointment_confirmed } : {}),
    ...(authoritative.outcome.doctor_confirmed !== undefined ? { doctorConfirmed: authoritative.outcome.doctor_confirmed } : {}),
    ...(authoritative.outcome.first_visit !== undefined ? { firstVisit: authoritative.outcome.first_visit } : {}),
    ...(authoritative.outcome.identity_document_reminder_given !== undefined ? { identityDocumentReminderGiven: authoritative.outcome.identity_document_reminder_given } : {}),
    ...(authoritative.outcome.arrive_30_minutes_early !== undefined ? { arrive30MinutesEarly: authoritative.outcome.arrive_30_minutes_early } : {}),
    ...(authoritative.outcome.registration_reminder_given !== undefined ? { registrationReminderGiven: authoritative.outcome.registration_reminder_given } : {}),
    ...(authoritative.outcome.information_form_reminder_given !== undefined ? { informationFormReminderGiven: authoritative.outcome.information_form_reminder_given } : {}),
    ...(authoritative.outcome.conversation_completed !== undefined ? { conversationCompleted: authoritative.outcome.conversation_completed } : {}),
    ...(authoritative.outcome.appointment_decision !== undefined ? { appointmentDecision: authoritative.outcome.appointment_decision } : {}),
    ...(authoritative.outcome.reschedule_requested !== undefined ? { rescheduleRequested: authoritative.outcome.reschedule_requested } : {}),
    ...(authoritative.outcome.reschedule_completed !== undefined ? { rescheduleCompleted: authoritative.outcome.reschedule_completed } : {}),
    ...(authoritative.outcome.new_appointment_date !== undefined ? { newAppointmentDate: authoritative.outcome.new_appointment_date } : {}),
    ...(authoritative.outcome.new_appointment_time !== undefined ? { newAppointmentTime: authoritative.outcome.new_appointment_time } : {}),
  };

  const reconciliation = isAppointment
    ? reconcileAppointmentTransaction(transaction as PreparedAppointmentTransaction, evidence)
    : reconcileTransaction(transaction as PreparedTransaction, evidence);
  const receipt = createTransactionReceipt({ transactionId: transaction.transactionId, transaction, evidence, decision: reconciliation.decision });
  const state = reconciliation.decision === "commit" ? "resolved" : reconciliation.decision === "abort" ? "escalated" : "recovering";
  const record = ledger.transition(operationKey, state, {
    outcome: authoritative.outcome,
    transactionDecision: reconciliation.decision,
    transactionReasons: reconciliation.reasons,
    transactionReceipt: receipt,
  });

  return { record, authoritative, transaction, evidence, reconciliation, receipt };
}
