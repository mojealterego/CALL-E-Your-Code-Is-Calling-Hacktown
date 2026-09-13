export type TransactionDecision = "prepared" | "commit" | "abort" | "recover";

export interface TransactionConstraints {
  route: string;
  maxEta: string;
}

export interface PreparedTransaction {
  transactionId: string;
  incidentId: string;
  participantId: string;
  action: "route_change";
  constraints: TransactionConstraints;
  status: "prepared";
}

export interface ObservedEvidence {
  route?: string;
  eta?: string;
  acceptance: "yes" | "no" | "unknown";
  confidence: "high" | "medium" | "low" | "unknown";
  evidenceSummary: string;
  taskCompleted?: boolean;
  completionConfidence?: string;
}

export interface ReconciliationResult {
  decision: Exclude<TransactionDecision, "prepared">;
  reasons: string[];
}

function clockToMinutes(value: string): number | undefined {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function prepareTransaction(input: {
  transactionId: string;
  incidentId: string;
  participantId: string;
  route: string;
  maxEta: string;
}): PreparedTransaction {
  if (!input.transactionId || !input.incidentId || !input.participantId) {
    throw new Error("transaction identity is required");
  }
  if (!input.route || clockToMinutes(input.maxEta) === undefined) {
    throw new Error("valid transaction constraints are required");
  }
  return {
    transactionId: input.transactionId,
    incidentId: input.incidentId,
    participantId: input.participantId,
    action: "route_change",
    constraints: { route: input.route, maxEta: input.maxEta },
    status: "prepared",
  };
}

export function reconcileTransaction(
  transaction: PreparedTransaction,
  evidence: ObservedEvidence,
): ReconciliationResult {
  const reasons: string[] = [];
  const observedEta = evidence.eta ? clockToMinutes(evidence.eta) : undefined;
  const maxEta = clockToMinutes(transaction.constraints.maxEta);

  if (evidence.acceptance !== "yes") reasons.push("participant did not positively accept the proposed change");
  if (evidence.confidence !== "high") reasons.push("evidence confidence is not high");
  if (evidence.taskCompleted !== true) reasons.push("CALL-E task did not establish a successful terminal completion");
  if (!evidence.evidenceSummary.trim()) reasons.push("evidence summary is missing");
  if (evidence.route !== transaction.constraints.route) reasons.push("observed route does not match prepared route");
  if (observedEta === undefined) reasons.push("observed ETA is missing or invalid");
  else if (maxEta !== undefined && observedEta > maxEta) reasons.push("observed ETA exceeds prepared constraint");

  if (
    evidence.acceptance === "unknown" ||
    evidence.confidence === "unknown" ||
    evidence.route === undefined ||
    observedEta === undefined ||
    evidence.taskCompleted !== true
  ) {
    return { decision: "recover", reasons };
  }
  if (reasons.length > 0) return { decision: "abort", reasons };
  return { decision: "commit", reasons: ["observed evidence matches the prepared transaction"] };
}
