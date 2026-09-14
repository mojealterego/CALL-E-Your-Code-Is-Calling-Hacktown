import { canResolve } from "./policy.js";
import type { CallOutcome } from "./domain.js";

export type RedTeamCase =
  | "policy_rejection"
  | "missing_evidence"
  | "low_confidence"
  | "malformed_outcome"
  | "duplicate_operation"
  | "budget_breach"
  | "contradictory_outcome"
  | "replayed_event";

export interface RedTeamScenario {
  id: string;
  description: string;
  outcome?: Partial<CallOutcome>;
  policyPassed: boolean;
  duplicate: boolean;
  replayed: boolean;
  latencyMs: number;
  estimatedCostUsd: number;
  expectedEscalation: boolean;
}

export interface RedTeamResult {
  id: string;
  passed: boolean;
  expectedEscalation: boolean;
  observedEscalation: boolean;
  reason: string;
}

const safeOutcome: CallOutcome = {
  route_acceptance: "yes",
  eta_update_time: "16:40",
  escalation_needed: "none",
  evidence_summary: "Driver confirmed the revised ETA.",
  confidence: "high",
};

export function syntheticRedTeamCases(): RedTeamScenario[] {
  return [
    scenario("policy_rejection", "Policy denies the operation.", { policyPassed: false }),
    scenario("missing_evidence", "Outcome has no evidence.", { outcome: { ...safeOutcome, evidence_summary: "" } }),
    scenario("low_confidence", "Outcome confidence is low.", { outcome: { ...safeOutcome, confidence: "low" } }),
    scenario("malformed_outcome", "Outcome is incomplete.", { outcome: { route_acceptance: "yes" } }),
    scenario("duplicate_operation", "The operation was already reserved.", { duplicate: true }),
    scenario("budget_breach", "Latency and cost exceed prototype budgets.", { latencyMs: 2501, estimatedCostUsd: 0.26 }),
    scenario("contradictory_outcome", "Route accepted but escalation is required.", { outcome: { ...safeOutcome, escalation_needed: "urgent" } }),
    scenario("replayed_event", "The same external event is replayed.", { replayed: true }),
  ];
}

export function runSyntheticRedTeam(cases = syntheticRedTeamCases()): RedTeamResult[] {
  return cases.map((testCase) => {
    const observedEscalation = shouldEscalate(testCase);
    const passed = observedEscalation === testCase.expectedEscalation;
    return {
      id: testCase.id,
      passed,
      expectedEscalation: testCase.expectedEscalation,
      observedEscalation,
      reason: passed ? "Safety expectation preserved." : "Safety expectation violated.",
    };
  });
}

function scenario(id: RedTeamCase, description: string, overrides: Partial<RedTeamScenario> = {}): RedTeamScenario {
  return {
    id,
    description,
    policyPassed: true,
    duplicate: false,
    replayed: false,
    latencyMs: 700,
    estimatedCostUsd: 0.08,
    outcome: safeOutcome,
    expectedEscalation: true,
    ...overrides,
  };
}

function shouldEscalate(testCase: RedTeamScenario): boolean {
  if (!testCase.policyPassed || testCase.duplicate || testCase.replayed) return true;
  if (testCase.latencyMs > 2000 || testCase.estimatedCostUsd > 0.25) return true;
  if (!testCase.outcome) return true;
  const outcome = testCase.outcome;
  if (outcome.route_acceptance !== "yes"
    || !outcome.eta_update_time?.trim()
    || outcome.escalation_needed !== "none"
    || !outcome.evidence_summary?.trim()
    || outcome.confidence !== "high") return true;
  return !canResolve(outcome as CallOutcome);
}
