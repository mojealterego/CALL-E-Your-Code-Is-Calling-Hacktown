export type TransactionDecision = "prepared" | "commit" | "abort" | "recover";

export interface TransactionConstraints {
  route: string;
  maxEtaMinutes: number;
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
  etaMinutes?: number;
  acceptance: "yes" | "no" | "unknown";
  confidence: "high" | "medium" | "low" | "unknown";
  evidenceSummary: string;
}

export interface ReconciliationResult {
  decision: Exclude<TransactionDecision, "prepared">;
  reasons: string[];
}

export function prepareTransaction(input: {
  transactionId: string;
  incidentId: string;
  participantId: string;
  route: string;
  maxEtaMinutes: number;
}): PreparedTransaction {
  if (!input.transactionId || !input.incidentId || !input.participantId) {
    throw new Error("transaction identity is required");
  }
  if (!input.route || !Number.isFinite(input.maxEtaMinutes) || input.maxEtaMinutes <= 0) {
    throw new Error("valid transaction constraints are required");
  }
  return {
    transactionId: input.transactionId,
    incidentId: input.incidentId,
    participantId: input.participantId,
    action: "route_change",
    constraints: { route: input.route, maxEtaMinutes: input.maxEtaMinutes },
    status: "prepared",
  };
}

export function reconcileTransaction(
  transaction: PreparedTransaction,
  evidence: ObservedEvidence,
): ReconciliationResult {
  const reasons: string[] = [];
  if (evidence.acceptance !== "yes") {
    reasons.push("participant did not positively accept the proposed change");
  }
  if (evidence.confidence !== "high") {
    reasons.push("evidence confidence is not high");
  }
  if (!evidence.evidenceSummary.trim()) {
    reasons.push("evidence summary is missing");
  }
  if (evidence.route !== transaction.constraints.route) {
    reasons.push("observed route does not match prepared route");
  }
  if (evidence.etaMinutes === undefined) {
    reasons.push("observed ETA is missing");
  } else if (evidence.etaMinutes > transaction.constraints.maxEtaMinutes) {
    reasons.push("observed ETA exceeds prepared constraint");
  }

  if (evidence.acceptance === "unknown" || evidence.confidence === "unknown" || evidence.route === undefined || evidence.etaMinutes === undefined) {
    return { decision: "recover", reasons };
  }
  if (reasons.length > 0) return { decision: "abort", reasons };
  return { decision: "commit", reasons: ["observed evidence matches the prepared transaction"] };
}
