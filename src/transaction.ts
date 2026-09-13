export type TransactionDecision = "prepared" | "commit" | "abort" | "recover";

export interface TransactionConstraints { route: string; maxEta: string; }
export interface AppointmentConstraints { clinicName: string; patientName: string; doctorName: string; appointmentReference: string; }

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
  appointmentConfirmed?: "yes" | "no" | "unknown";
  doctorConfirmed?: string;
  firstVisit?: "yes" | "no" | "unknown";
  identityDocumentReminderGiven?: boolean;
  arrive30MinutesEarly?: boolean;
  registrationReminderGiven?: boolean;
  conversationCompleted?: boolean;
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
  if (!input.constraints.clinicName || !input.constraints.patientName || !input.constraints.doctorName) throw new Error("valid appointment constraints are required");
  return { transactionId: input.transactionId, incidentId: input.incidentId, participantId: input.participantId, action: "appointment_confirmation", constraints: input.constraints, status: "prepared" };
}

export function reconcileAppointmentTransaction(transaction: PreparedAppointmentTransaction, evidence: ObservedEvidence): ReconciliationResult {
  const reasons: string[] = [];
  if (evidence.providerStatus !== "completed") reasons.push("authoritative CALL-E status is not completed");
  if (evidence.appointmentConfirmed !== "yes") reasons.push("patient did not positively confirm the appointment");
  if (evidence.doctorConfirmed !== transaction.constraints.doctorName) reasons.push("confirmed doctor does not match prepared appointment");
  if (evidence.confidence !== "high") reasons.push("evidence confidence is not high");
  if (evidence.taskCompleted !== true) reasons.push("CALL-E task did not establish a successful terminal completion");
  if (!evidence.evidenceSummary.trim()) reasons.push("evidence summary is missing");
  if (!evidence.evidenceItems?.length) reasons.push("CALL-E terminal evidence is missing");
  if (evidence.firstVisit === "yes" && evidence.identityDocumentReminderGiven !== true) reasons.push("first-visit identity document reminder was not given");
  if (evidence.firstVisit === "yes" && evidence.arrive30MinutesEarly !== true) reasons.push("first-visit 30-minute early-arrival instruction was not given");
  if (evidence.firstVisit === "yes" && evidence.registrationReminderGiven !== true) reasons.push("first-visit registration instruction was not given");
  if (evidence.conversationCompleted !== true) reasons.push("conversation was not cleanly completed");
  const incomplete = evidence.providerStatus !== "completed" || evidence.appointmentConfirmed === "unknown" || evidence.doctorConfirmed === undefined || evidence.firstVisit === "unknown" || evidence.taskCompleted !== true || !evidence.evidenceItems?.length;
  if (incomplete) return { decision: "recover", reasons };
  if (reasons.length > 0) return { decision: "abort", reasons };
  return { decision: "commit", reasons: ["authoritative appointment evidence matches the prepared transaction"] };
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
