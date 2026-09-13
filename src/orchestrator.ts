import type { Incident } from "./domain.js";
import { validateIncident } from "./policy.js";
import { AuditLedger } from "./ledger.js";
import { simulateCall } from "./simulator.js";
import { executeWithCalle } from "./calle.js";
import { validateOutcome } from "./validation.js";
import { prepareAppointmentTransaction, prepareTransaction, reconcileAppointmentTransaction, reconcileTransaction } from "./transaction.js";
import { createTransactionReceipt } from "./receipt.js";
import { createCallCapability } from "./capability.js";

function failureOutcome(message: string) {
  return validateOutcome({ route: "", route_acceptance: "unknown", eta_update_time: "", escalation_needed: "urgent", evidence_summary: message, confidence: "unknown" });
}

export async function runIncident(incident: Incident, options: { live: boolean; ledger?: AuditLedger } = { live: false }) {
  const ledger = options.ledger ?? new AuditLedger();
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const reserved = ledger.reserve(operationKey);
  if (reserved.state !== "detected") return { record: reserved, reused: true, outcome: reserved.outcome };

  const policy = validateIncident(incident, options.live);
  if (!policy.allowed) {
    const record = ledger.transition(operationKey, "escalated", { outcome: failureOutcome(policy.reasons.join("; ")), transactionDecision: "abort", transactionReasons: policy.reasons });
    return { record, reused: false, outcome: record.outcome };
  }
  ledger.transition(operationKey, "validated");

  const isAppointment = incident.appointment !== undefined;
  const transaction = isAppointment
    ? prepareAppointmentTransaction({ transactionId: `TX-${incident.id}`, incidentId: incident.id, participantId: incident.vehicleId, constraints: incident.appointment })
    : prepareTransaction({ transactionId: `TX-${incident.id}`, incidentId: incident.id, participantId: incident.vehicleId, route: incident.proposedRoute, maxEta: incident.maxEta });
  ledger.transition(operationKey, "prepared", { transactionId: transaction.transactionId });

  const capability = createCallCapability({
    operationKey,
    participantId: incident.vehicleId,
    endpoint: incident.phone,
    scope: isAppointment ? "appointment_confirmation" : "route_change",
    constraints: transaction.constraints,
  });
  ledger.transition(operationKey, "calling", { capabilityId: capability.capabilityId });

  try {
    const raw = options.live ? await executeWithCalle(incident, operationKey, capability) : { status: "completed" as const, outcome: simulateCall(incident) };
    const outcome = validateOutcome(raw.outcome);
    ledger.transition(operationKey, "verifying", { ...(raw.callId ? { callId: raw.callId } : {}), outcome });

    const observedEvidence = {
      route: outcome.route,
      eta: outcome.eta_update_time,
      acceptance: outcome.route_acceptance,
      confidence: outcome.confidence,
      evidenceSummary: outcome.evidence_summary,
      providerStatus: raw.status,
      ...(outcome.evidence !== undefined ? { evidenceItems: outcome.evidence } : {}),
      ...(outcome.task_completed !== undefined ? { taskCompleted: outcome.task_completed } : {}),
      ...(outcome.completion_confidence !== undefined ? { completionConfidence: outcome.completion_confidence } : {}),
      ...(outcome.patient_confirmed !== undefined ? { patientConfirmed: outcome.patient_confirmed } : {}),
      ...(outcome.appointment_confirmed !== undefined ? { appointmentConfirmed: outcome.appointment_confirmed } : {}),
      ...(outcome.doctor_confirmed !== undefined ? { doctorConfirmed: outcome.doctor_confirmed } : {}),
      ...(outcome.first_visit !== undefined ? { firstVisit: outcome.first_visit } : {}),
      ...(outcome.identity_document_reminder_given !== undefined ? { identityDocumentReminderGiven: outcome.identity_document_reminder_given } : {}),
      ...(outcome.arrive_30_minutes_early !== undefined ? { arrive30MinutesEarly: outcome.arrive_30_minutes_early } : {}),
      ...(outcome.registration_reminder_given !== undefined ? { registrationReminderGiven: outcome.registration_reminder_given } : {}),
      ...(outcome.information_form_reminder_given !== undefined ? { informationFormReminderGiven: outcome.information_form_reminder_given } : {}),
      ...(outcome.conversation_completed !== undefined ? { conversationCompleted: outcome.conversation_completed } : {}),
      ...(outcome.appointment_decision !== undefined ? { appointmentDecision: outcome.appointment_decision } : {}),
      ...(outcome.reschedule_requested !== undefined ? { rescheduleRequested: outcome.reschedule_requested } : {}),
      ...(outcome.reschedule_completed !== undefined ? { rescheduleCompleted: outcome.reschedule_completed } : {}),
      ...(outcome.new_appointment_date !== undefined ? { newAppointmentDate: outcome.new_appointment_date } : {}),
      ...(outcome.new_appointment_time !== undefined ? { newAppointmentTime: outcome.new_appointment_time } : {}),
    };
    const reconciliation = isAppointment
      ? reconcileAppointmentTransaction(transaction, observedEvidence)
      : reconcileTransaction(transaction, observedEvidence);
    const receipt = createTransactionReceipt({ transactionId: transaction.transactionId, transaction: { ...transaction, capability }, evidence: observedEvidence, decision: reconciliation.decision });
    const state = reconciliation.decision === "commit" ? "resolved" : reconciliation.decision === "recover" ? "recovering" : "escalated";
    const record = ledger.transition(operationKey, state, { transactionDecision: reconciliation.decision, transactionReasons: reconciliation.reasons, transactionReceipt: receipt });
    return { record, reused: false, outcome, transaction, capability, reconciliation, receipt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CALL-E execution failure";
    const record = ledger.transition(operationKey, "recovering", { outcome: failureOutcome(message), transactionDecision: "recover", transactionReasons: [message] });
    return { record, reused: false, outcome: record.outcome, capability };
  }
}
