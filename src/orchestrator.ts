import type { Incident } from "./domain.js";
import { validateIncident } from "./policy.js";
import { AuditLedger } from "./ledger.js";
import { simulateCall } from "./simulator.js";
import { executeWithCalle } from "./calle.js";
import { validateOutcome } from "./validation.js";
import { prepareTransaction, reconcileTransaction } from "./transaction.js";
import { createTransactionReceipt } from "./receipt.js";

function failureOutcome(message: string) {
  return validateOutcome({
    route: "",
    route_acceptance: "unknown",
    eta_update_time: "",
    escalation_needed: "urgent",
    evidence_summary: message,
    confidence: "unknown",
  });
}

export async function runIncident(
  incident: Incident,
  options: { live: boolean; ledger?: AuditLedger } = { live: false },
) {
  const ledger = options.ledger ?? new AuditLedger();
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const reserved = ledger.reserve(operationKey);

  if (reserved.state !== "detected") {
    return { record: reserved, reused: true, outcome: reserved.outcome };
  }

  const policy = validateIncident(incident, options.live);
  if (!policy.allowed) {
    const record = ledger.transition(operationKey, "escalated", {
      outcome: failureOutcome(policy.reasons.join("; ")),
      transactionDecision: "abort",
      transactionReasons: policy.reasons,
    });
    return { record, reused: false, outcome: record.outcome };
  }

  ledger.transition(operationKey, "validated");

  const transaction = prepareTransaction({
    transactionId: `TX-${incident.id}`,
    incidentId: incident.id,
    participantId: incident.vehicleId,
    route: incident.proposedRoute,
    maxEta: incident.maxEta,
  });
  ledger.transition(operationKey, "prepared", { transactionId: transaction.transactionId });
  ledger.transition(operationKey, "calling");

  try {
    const raw = options.live
      ? await executeWithCalle(incident, operationKey)
      : { status: "completed" as const, outcome: simulateCall(incident) };
    const outcome = validateOutcome(raw.outcome);
    ledger.transition(operationKey, "verifying", {
      ...(raw.callId ? { callId: raw.callId } : {}),
      outcome,
    });

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
    };
    const reconciliation = reconcileTransaction(transaction, observedEvidence);
    const receipt = createTransactionReceipt({
      transactionId: transaction.transactionId,
      transaction,
      evidence: observedEvidence,
      decision: reconciliation.decision,
    });

    const state = reconciliation.decision === "commit"
      ? "resolved"
      : reconciliation.decision === "recover"
        ? "recovering"
        : "escalated";

    const record = ledger.transition(operationKey, state, {
      transactionDecision: reconciliation.decision,
      transactionReasons: reconciliation.reasons,
      transactionReceipt: receipt,
    });
    return { record, reused: false, outcome, transaction, reconciliation, receipt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CALL-E execution failure";
    const record = ledger.transition(operationKey, "recovering", {
      outcome: failureOutcome(message),
      transactionDecision: "recover",
      transactionReasons: [message],
    });
    return { record, reused: false, outcome: record.outcome };
  }
}
