import type { CallOutcome, Incident } from "./domain.js";
import type { CalleCallStatus } from "./calle.js";
import { AuditLedger } from "./ledger.js";
import { prepareTransaction, reconcileTransaction } from "./transaction.js";
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

export async function fetchAuthoritativeCall(callId: string, apiKey = process.env.CALLE_API_KEY): Promise<AuthoritativeCall> {
  if (!apiKey) throw new Error("CALLE_API_KEY is required for authoritative recovery");
  if (!/^call_[A-Za-z0-9_-]+$/.test(callId)) throw new Error("invalid CALL-E call id");

  const response = await fetch(`https://api.heycall-e.com/v1/calls/${encodeURIComponent(callId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`CALL-E authoritative fetch failed: HTTP ${response.status}`);

  const body = await response.json() as Record<string, unknown>;
  const status = statusOf(body.status);
  const structured = body.structured_result;
  const raw = structured && typeof structured === "object"
    ? {
        ...(structured as Record<string, unknown>),
        ...(body.task_completed !== null && body.task_completed !== undefined ? { task_completed: body.task_completed } : {}),
        ...(body.completion_confidence !== null && body.completion_confidence !== undefined ? { completion_confidence: body.completion_confidence } : {}),
        ...(Array.isArray(body.evidence) ? { evidence: body.evidence.filter((item): item is string => typeof item === "string") } : {}),
        ...(typeof body.failure_code === "string" ? { failure_code: body.failure_code } : {}),
        ...(typeof body.failure_message === "string" ? { failure_message: body.failure_message } : {}),
      }
    : {
        route: "",
        route_acceptance: "unknown",
        eta_update_time: "",
        escalation_needed: "urgent",
        evidence_summary: typeof body.failure_message === "string" ? body.failure_message : "CALL-E authoritative result is unavailable",
        confidence: "unknown",
        ...(Array.isArray(body.evidence) ? { evidence: body.evidence.filter((item): item is string => typeof item === "string") } : {}),
        ...(body.task_completed !== null && body.task_completed !== undefined ? { task_completed: body.task_completed } : {}),
        ...(body.completion_confidence !== null && body.completion_confidence !== undefined ? { completion_confidence: body.completion_confidence } : {}),
      };

  return { id: callId, status, outcome: validateOutcome(raw) };
}

/**
 * Resumes an existing RECOVERING incident without placing another outbound call.
 * The existing CALL-E call is re-fetched, then reconciled against the original prepared constraints.
 */
export async function recoverIncident(
  incident: Incident,
  ledger: AuditLedger,
  apiKey = process.env.CALLE_API_KEY,
) {
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const current = ledger.reserve(operationKey);
  if (current.state !== "recovering") {
    throw new Error(`incident is not recoverable from state ${current.state}`);
  }
  if (!current.callId) {
    throw new Error("cannot recover without an existing CALL-E call id");
  }

  const transaction = prepareTransaction({
    transactionId: current.transactionId ?? `TX-${incident.id}`,
    incidentId: incident.id,
    participantId: incident.vehicleId,
    route: incident.proposedRoute,
    maxEta: incident.maxEta,
  });

  const authoritative = await fetchAuthoritativeCall(current.callId, apiKey);
  ledger.transition(operationKey, "verifying", {
    outcome: authoritative.outcome,
    callId: authoritative.id,
    transactionId: transaction.transactionId,
  });

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
  };
  const reconciliation = reconcileTransaction(transaction, evidence);
  const receipt = createTransactionReceipt({
    transactionId: transaction.transactionId,
    transaction,
    evidence,
    decision: reconciliation.decision,
  });

  const state = reconciliation.decision === "commit"
    ? "resolved"
    : reconciliation.decision === "abort"
      ? "escalated"
      : "recovering";
  const record = state === "recovering"
    ? ledger.transition(operationKey, state, {
        outcome: authoritative.outcome,
        transactionDecision: reconciliation.decision,
        transactionReasons: reconciliation.reasons,
        transactionReceipt: receipt,
      })
    : ledger.transition(operationKey, state, {
        outcome: authoritative.outcome,
        transactionDecision: reconciliation.decision,
        transactionReasons: reconciliation.reasons,
        transactionReceipt: receipt,
      });

  return { record, authoritative, transaction, evidence, reconciliation, receipt };
}
