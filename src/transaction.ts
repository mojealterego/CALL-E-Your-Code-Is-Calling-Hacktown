export type TransactionDecision = "prepared" | "commit" | "abort" | "recover";

export interface TransactionConstraints { route: string; maxEta: string; }
export interface AppointmentSlot { date: string; time: string; }
export interface AppointmentConstraints {
  clinicName: string;
  patientName: string;
  doctorName: string;
  appointmentReference: string;
  appointmentDate: string;
  appointmentTime: string;
  availableSlots: AppointmentSlot[];
}

export interface PreparedTransaction {
  transactionId: string;
  incidentId: string;
  participantId: string;
  action: "route_change";
  constraints: TransactionConstraints;
  status: "prepared";
}

export interface PreparedAppointmentTransaction {
  transactionId: string;
  incidentId: string;
  participantId: string;
  action: "appointment_confirmation";
  constraints: AppointmentConstraints;
  status: "prepared";
}

export interface ObservedEvidence {
  route?: string;
  eta?: string;
  acceptance: "yes" | "no" | "unknown";
  confidence: "high" | "medium" | "low" | "unknown";
  evidenceSummary: string;
  evidenceItems?: string[];
  taskCompleted?: boolean;
  completionConfidence?: unknown;
  providerStatus?: "completed" | "failed" | "canceled" | "queued" | "in_progress" | "unknown";
  patientConfirmed?: "yes" | "no" | "unknown";
  appointmentConfirmed?: "yes" | "no" | "unknown";
  doctorConfirmed?: string;
  firstVisit?: "yes" | "no" | "unknown";
  identityDocumentReminderGiven?: boolean;
  arrive30MinutesEarly?: boolean;
  registrationReminderGiven?: boolean;
  informationFormReminderGiven?: boolean;
  conversationCompleted?: boolean;
  appointmentDecision?: "confirm" | "reschedule" | "cancel" | "unknown";
  rescheduleRequested?: boolean;
  rescheduleCompleted?: boolean;
  newAppointmentDate?: string;
  newAppointmentTime?: string;
}

export interface ReconciliationResult { decision: Exclude<TransactionDecision, "prepared">; reasons: string[]; }
function clockToMinutes(value: string): number | undefined {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined;
  const parts = value.split(":"); const hours = Number(parts[0]); const minutes = Number(parts[1]);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : undefined;
}

export function prepareTransaction(input: { transactionId: string; incidentId: string; participantId: string; route: string; maxEta: string; }): PreparedTransaction {
  if (!input.transactionId || !input.incidentId || !input.participantId) throw new Error("transaction identity is required");
  if (!input.route || clockToMinutes(input.maxEta) === undefined) throw new Error("valid transaction constraints are required");
  return { transactionId: input.transactionId, incidentId: input.incidentId, participantId: input.participantId, action: "route_change", constraints: { route: input.route, maxEta: input.maxEta }, status: "prepared" };
}

export function prepareAppointmentTransaction(input: { transactionId: string; incidentId: string; participantId: string; constraints: AppointmentConstraints; }): PreparedAppointmentTransaction {
  if (!input.transactionId || !input.incidentId || !input.participantId) throw new Error("transaction identity is required");
  if (!input.constraints.clinicName || !input.constraints.patientName || !input.constraints.doctorName || !input.constraints.appointmentDate || !input.constraints.appointmentTime) throw new Error("valid appointment constraints are required");
  if (!Array.isArray(input.constraints.availableSlots) || input.constraints.availableSlots.length === 0) throw new Error("appointment availability is required");
  if (input.constraints.availableSlots.some((slot) => !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time))) throw new Error("appointment availability contains an invalid slot");
  return { transactionId: input.transactionId, incidentId: input.incidentId, participantId: input.participantId, action: "appointment_confirmation", constraints: input.constraints, status: "prepared" };
}

export function reconcileAppointmentTransaction(transaction: PreparedAppointmentTransaction, evidence: ObservedEvidence): ReconciliationResult {
  const reasons: string[] = [];
  if (evidence.providerStatus !== "completed") reasons.push("authoritative CALL-E status is not completed");
  if (evidence.confidence !== "high") reasons.push("evidence confidence is not high");
  if (evidence.taskCompleted !== true) reasons.push("CALL-E task did not establish a successful terminal completion");
  if (!evidence.evidenceSummary.trim()) reasons.push("evidence summary is missing");
  if (!evidence.evidenceItems?.length) reasons.push("CALL-E terminal evidence is missing");
  if (evidence.patientConfirmed !== "yes") reasons.push("patient identity was not positively confirmed");
  if (evidence.doctorConfirmed !== transaction.constraints.doctorName) reasons.push("confirmed doctor does not match prepared appointment");
  if (evidence.conversationCompleted !== true) reasons.push("conversation was not cleanly completed");

  const firstVisitFields = [evidence.identityDocumentReminderGiven, evidence.arrive30MinutesEarly, evidence.registrationReminderGiven, evidence.informationFormReminderGiven];
  if (evidence.patientConfirmed !== "yes" && firstVisitFields.some((field) => field === true)) reasons.push("first-visit instructions were reported before positive patient identity confirmation");

  if (evidence.appointmentDecision === "cancel") {
    if (reasons.length === 0) return { decision: "abort", reasons: ["patient explicitly declined the appointment"] };
    return { decision: "recover", reasons };
  }

  if (evidence.appointmentDecision === "reschedule") {
    if (evidence.rescheduleRequested !== true) reasons.push("reschedule was not explicitly requested");
    if (evidence.rescheduleCompleted !== true) reasons.push("reschedule was not completed");
    const selected = transaction.constraints.availableSlots.some((slot) => slot.date === evidence.newAppointmentDate && slot.time === evidence.newAppointmentTime);
    if (!selected) reasons.push("selected reschedule slot is not in prepared availability");
    if (reasons.length > 0) return { decision: "abort", reasons };
    return { decision: "commit", reasons: [`patient accepted ${evidence.newAppointmentDate} at ${evidence.newAppointmentTime}; appointment change is authorized by the prepared availability`] };
  }

  if (evidence.appointmentDecision !== "confirm") reasons.push("appointment decision is unknown");
  if (evidence.appointmentConfirmed !== "yes") reasons.push("patient did not positively confirm the appointment");
  if (evidence.firstVisit === "unknown") reasons.push("first-visit status is unknown");
  if (evidence.firstVisit === "no" && firstVisitFields.some((field) => field === true)) reasons.push("first-visit instructions were reported for a non-first visit");
  if (evidence.firstVisit === "yes" && firstVisitFields.some((field) => field !== true)) reasons.push("first-visit administrative instructions are incomplete");

  const incomplete = evidence.providerStatus !== "completed"
    || evidence.patientConfirmed !== "yes"
    || evidence.appointmentConfirmed === "unknown"
    || evidence.doctorConfirmed === undefined
    || evidence.firstVisit === "unknown"
    || evidence.appointmentDecision === "unknown"
    || evidence.taskCompleted !== true
    || !evidence.evidenceItems?.length;
  if (incomplete) return { decision: "recover", reasons };
  if (reasons.length > 0) return { decision: "abort", reasons };
  return { decision: "commit", reasons: ["patient confirmed the prepared appointment and all applicable administrative conditions"] };
}

export function reconcileTransaction(transaction: PreparedTransaction, evidence: ObservedEvidence): ReconciliationResult {
  const reasons: string[] = [];
  const observedEta = evidence.eta ? clockToMinutes(evidence.eta) : undefined;
  const maxEta = clockToMinutes(transaction.constraints.maxEta);
  if (evidence.providerStatus !== "completed") reasons.push("authoritative CALL-E status is not completed");
  if (evidence.acceptance !== "yes") reasons.push("participant did not positively accept the proposed change");
  if (evidence.confidence !== "high") reasons.push("evidence confidence is not high");
  if (evidence.taskCompleted !== true) reasons.push("CALL-E task did not establish a successful terminal completion");
  if (!evidence.evidenceSummary.trim()) reasons.push("evidence summary is missing");
  if (!evidence.evidenceItems?.length) reasons.push("CALL-E terminal evidence is missing");
  if (evidence.route !== transaction.constraints.route) reasons.push("observed route does not match prepared route");
  if (observedEta === undefined) reasons.push("observed ETA is missing or invalid");
  else if (maxEta !== undefined && observedEta > maxEta) reasons.push("observed ETA exceeds prepared constraint");
  if (evidence.providerStatus !== "completed" || evidence.acceptance === "unknown" || evidence.confidence === "unknown" || evidence.route === undefined || observedEta === undefined || evidence.taskCompleted !== true || !evidence.evidenceItems?.length) return { decision: "recover", reasons };
  if (reasons.length > 0) return { decision: "abort", reasons };
  return { decision: "commit", reasons: ["authoritative terminal evidence matches the prepared transaction"] };
}
