import { describe, expect, it } from "vitest";
import { assessDecision, compareCandidateToBaseline } from "../src/decision-intelligence.js";
import type { CallOutcome } from "../src/domain.js";

const resolved: CallOutcome = {
  route_acceptance: "yes",
  eta_update_time: "16:40",
  escalation_needed: "none",
  evidence_summary: "Driver confirmed the revised ETA.",
  confidence: "high",
};

describe("decision intelligence", () => {
  it("resolves only when policy, evidence and outcome gates pass", () => {
    expect(assessDecision(resolved, {
      latencyMs: 700,
      estimatedCostUsd: 0.08,
      confidence: "high",
      evidencePresent: true,
      policyPassed: true,
    }).action).toBe("resolve");
  });

  it("cannot resolve an outcome merely because metrics look good", () => {
    expect(assessDecision({ ...resolved, confidence: "low" }, {
      latencyMs: 100,
      estimatedCostUsd: 0.01,
      confidence: "low",
      evidencePresent: true,
      policyPassed: true,
    }).action).toBe("escalate");
  });

  it("supports bounded baseline-versus-candidate comparison", () => {
    const result = compareCandidateToBaseline(
      { latencyMs: 1000, estimatedCostUsd: 0.10, confidence: "high", evidencePresent: true, policyPassed: true },
      { latencyMs: 800, estimatedCostUsd: 0.08, confidence: "high", evidencePresent: true, policyPassed: true },
    );
    expect(result.candidateWins).toBe(true);
    expect(result.latencyDeltaMs).toBe(-200);
  });
});
