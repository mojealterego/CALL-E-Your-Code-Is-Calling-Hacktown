import type { TransactionReceipt } from "./receipt.js";

export type IncidentState =
  | "detected"
  | "validated"
  | "prepared"
  | "calling"
  | "verifying"
  | "resolved"
  | "escalated"
  | "recovering";

export type RouteAcceptance = "yes" | "no" | "unknown";
export type EscalationLevel = "urgent" | "normal" | "none" | "unknown";
export type ConfidenceLabel = "high" | "medium" | "low" | "unknown";

export interface CompletionConfidence {
  score?: number;
  label?: string;
}

export interface Incident {
  id: string;
  vehicleId: string;
  phone: string;
  closure: string;
  requestedBy: string;
  goal: string;
  proposedRoute: string;
  maxEta: string;
  region?: string;
  locale?: string;
}

export interface CallOutcome {
  route: string;
  route_acceptance: RouteAcceptance;
  eta_update_time: string;
  escalation_needed: EscalationLevel;
  evidence_summary: string;
  evidence?: string[];
  confidence: ConfidenceLabel;
  completion_confidence?: CompletionConfidence | string;
  task_completed?: boolean;
  failure_code?: string;
  failure_message?: string;
}

export interface CallRecord {
  operationKey: string;
  callId?: string;
  capabilityId?: string;
  state: IncidentState;
  createdAt: string;
  updatedAt: string;
  outcome?: CallOutcome;
  transactionId?: string;
  transactionDecision?: "commit" | "abort" | "recover";
  transactionReasons?: string[];
  transactionReceipt?: TransactionReceipt;
  previousAuditDigest?: string;
  auditDigest?: string;
}

export const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "route",
    "route_acceptance",
    "eta_update_time",
    "escalation_needed",
    "evidence_summary",
    "confidence"
  ],
  properties: {
    route: { type: "string", description: "The exact route the recipient explicitly discussed or accepted. Use an empty string if not established." },
    route_acceptance: {
      type: "string",
      enum: ["yes", "no", "unknown"],
      description: "Use yes only when the recipient clearly accepts the proposed route; no when they clearly reject it; unknown when the call does not establish this."
    },
    eta_update_time: { type: "string", description: "The revised ETA explicitly stated by the recipient, preferably HH:MM; use an empty string if not established." },
    escalation_needed: {
      type: "string",
      enum: ["urgent", "normal", "none", "unknown"]
    },
    evidence_summary: { type: "string", minLength: 1, description: "Concise evidence grounded in what the recipient actually said; never infer missing facts." },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low", "unknown"]
    }
  }
} as const;
