import type { CallOutcome } from "./domain.js";
import { canResolve } from "./policy.js";

export type DecisionAction = "resolve" | "escalate";

export interface DecisionMetrics {
  latencyMs: number;
  estimatedCostUsd: number;
  confidence: CallOutcome["confidence"];
  evidencePresent: boolean;
  policyPassed: boolean;
}

export interface DecisionAssessment {
  action: DecisionAction;
  score: number;
  reasons: string[];
}

/** Deterministic decision layer: metrics inform a decision, but never bypass policy. */
export function assessDecision(
  outcome: CallOutcome,
  metrics: DecisionMetrics,
): DecisionAssessment {
  const reasons: string[] = [];
  let score = 0;

  if (metrics.policyPassed) score += 2;
  else reasons.push("policy gate rejected the operation");

  if (canResolve(outcome)) score += 3;
  else reasons.push("outcome does not satisfy the resolution contract");

  if (metrics.evidencePresent) score += 2;
  else reasons.push("evidence is missing");

  if (metrics.confidence === "high") score += 2;
  else reasons.push(`confidence=${metrics.confidence}`);

  if (metrics.latencyMs > 2000) reasons.push("latency exceeded 2s observation budget");
  if (metrics.estimatedCostUsd > 0.25) reasons.push("cost exceeded per-operation observation budget");

  // Hard safety rule: no metric can turn an unsafe outcome into resolution.
  const action: DecisionAction = canResolve(outcome) && metrics.policyPassed && metrics.evidencePresent
    ? "resolve"
    : "escalate";

  return { action, score, reasons };
}

export function compareCandidateToBaseline(
  baseline: DecisionMetrics,
  candidate: DecisionMetrics,
): { latencyDeltaMs: number; costDeltaUsd: number; confidenceDelta: number; candidateWins: boolean } {
  const confidenceRank = { unknown: 0, low: 1, medium: 2, high: 3 } as const;
  const latencyDeltaMs = candidate.latencyMs - baseline.latencyMs;
  const costDeltaUsd = candidate.estimatedCostUsd - baseline.estimatedCostUsd;
  const confidenceDelta = confidenceRank[candidate.confidence] - confidenceRank[baseline.confidence];

  return {
    latencyDeltaMs,
    costDeltaUsd,
    confidenceDelta,
    candidateWins:
      candidate.policyPassed &&
      candidate.evidencePresent &&
      confidenceDelta >= 0 &&
      latencyDeltaMs <= 0 &&
      costDeltaUsd <= 0,
  };
}
