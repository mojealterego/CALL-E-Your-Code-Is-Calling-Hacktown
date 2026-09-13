import type { AppointmentSlot } from "./domain.js";

export type AssuranceMode = "normal" | "degraded" | "restricted" | "recovery-only" | "human-review";
export type PromotionDecision = "reject" | "shadow" | "candidate";

export interface FailureEvent {
  id: string;
  category: "unknown" | "contradiction" | "provider" | "verification" | "duplicate" | "timeout" | "policy" | "other";
  summary: string;
  occurredAt: string;
  transactionId?: string;
}

export interface AssuranceMetrics {
  failureRate: number;
  unknownRate: number;
  recoveryRate: number;
  contradictionRate: number;
  providerErrorRate: number;
  verificationFailureRate: number;
  duplicateExecutionAttempts: number;
  latencyMs: number;
  confidenceDegradation: number;
}

export interface SystemStateManifest {
  version: string;
  provider: string;
  capabilities: string[];
  authorizationScope: string[];
  policyVersion: string;
  knownFailures: string[];
  assuranceMode: AssuranceMode;
  verificationState: "verified" | "unverified" | "failed";
  constraints: string[];
  promotionState: "baseline" | "shadow" | "candidate" | "rejected";
  generatedAt: string;
}

export interface CounterfactualResult {
  question: string;
  counterexampleFound: boolean;
  severity: "none" | "medium" | "high" | "critical";
  reason: string;
}

export interface ChallengerResult {
  challengedDecision: "commit" | "abort" | "recover";
  objections: string[];
  passed: boolean;
}

export interface ShadowComparison {
  baselineScore: number;
  candidateScore: number;
  reliabilityDelta: number;
  verificationCoverageDelta: number;
  latencyDeltaMs: number;
  costDelta: number;
  candidateDominates: boolean;
}

export interface EvolutionCandidate {
  hypothesis: string;
  failureIds: string[];
  counterfactuals: CounterfactualResult[];
  challenger: ChallengerResult;
  shadow?: ShadowComparison;
  promotion: PromotionDecision;
  authorizationRequired: true;
}

export function assuranceHomeostasis(metrics: AssuranceMetrics): AssuranceMode {
  if (metrics.verificationFailureRate >= 0.25 || metrics.duplicateExecutionAttempts > 0) return "human-review";
  if (metrics.contradictionRate >= 0.20 || metrics.unknownRate >= 0.30) return "recovery-only";
  if (metrics.failureRate >= 0.20 || metrics.providerErrorRate >= 0.20) return "restricted";
  if (metrics.failureRate >= 0.10 || metrics.confidenceDegradation >= 0.20) return "degraded";
  return "normal";
}

export function counterfactualCheck(input: {
  decision: "commit" | "abort" | "recover";
  identityVerified: boolean;
  authoritativeCompleted: boolean;
  evidencePresent: boolean;
  selectedSlotPrepared: boolean;
  contradiction: boolean;
}): CounterfactualResult[] {
  const checks: CounterfactualResult[] = [
    { question: "What if identity was not actually verified?", counterexampleFound: !input.identityVerified, severity: !input.identityVerified ? "critical" : "none", reason: !input.identityVerified ? "Identity proof is absent." : "Identity invariant holds." },
    { question: "What if the provider did not complete the operation?", counterexampleFound: !input.authoritativeCompleted, severity: !input.authoritativeCompleted ? "critical" : "none", reason: !input.authoritativeCompleted ? "Authoritative completion is absent." : "Provider is terminal." },
    { question: "What if the result has no evidence?", counterexampleFound: !input.evidencePresent, severity: !input.evidencePresent ? "high" : "none", reason: !input.evidencePresent ? "No evidence can support commit." : "Evidence exists." },
    { question: "What if a replacement slot was invented?", counterexampleFound: !input.selectedSlotPrepared, severity: !input.selectedSlotPrepared ? "high" : "none", reason: !input.selectedSlotPrepared ? "Replacement slot is outside prepared availability." : "Replacement slot is prepared." },
    { question: "What if two claims contradict each other?", counterexampleFound: input.contradiction, severity: input.contradiction ? "high" : "none", reason: input.contradiction ? "Contradictory claims exist." : "No contradiction detected." },
  ];
  return input.decision === "commit" ? checks : checks.filter((check) => check.counterexampleFound);
}

export function challengeDecision(input: {
  decision: "commit" | "abort" | "recover";
  identityVerified: boolean;
  authoritativeCompleted: boolean;
  evidencePresent: boolean;
  contradiction: boolean;
}): ChallengerResult {
  const objections: string[] = [];
  if (input.decision === "commit" && !input.identityVerified) objections.push("Identity is not verified.");
  if (input.decision === "commit" && !input.authoritativeCompleted) objections.push("Provider completion is not authoritative.");
  if (input.decision === "commit" && !input.evidencePresent) objections.push("Evidence is missing.");
  if (input.decision === "commit" && input.contradiction) objections.push("Claims contradict.");
  return { challengedDecision: input.decision, objections, passed: objections.length === 0 };
}

export function compareShadowRuns(baseline: Omit<ShadowComparison, "candidateDominates" | "reliabilityDelta" | "verificationCoverageDelta" | "latencyDeltaMs" | "costDelta">, candidate: Omit<ShadowComparison, "candidateDominates" | "reliabilityDelta" | "verificationCoverageDelta" | "latencyDeltaMs" | "costDelta">): ShadowComparison {
  const reliabilityDelta = candidate.candidateScore - baseline.baselineScore;
  const verificationCoverageDelta = candidate.candidateScore - baseline.baselineScore;
  const latencyDeltaMs = candidate.baselineScore - baseline.baselineScore;
  const costDelta = candidate.candidateScore - baseline.baselineScore;
  return { baselineScore: baseline.baselineScore, candidateScore: candidate.candidateScore, reliabilityDelta, verificationCoverageDelta, latencyDeltaMs, costDelta, candidateDominates: reliabilityDelta > 0 && verificationCoverageDelta >= 0 && latencyDeltaMs <= 0 && costDelta <= 0 };
}

export function evaluatePromotion(shadow: ShadowComparison | undefined, challengerPassed: boolean, counterfactuals: CounterfactualResult[]): PromotionDecision {
  if (!challengerPassed || counterfactuals.some((c) => c.severity === "critical")) return "reject";
  if (!shadow) return "shadow";
  return shadow.candidateDominates ? "candidate" : "shadow";
}

export function buildSystemStateManifest(input: Omit<SystemStateManifest, "generatedAt">): SystemStateManifest {
  return { ...input, generatedAt: new Date().toISOString() };
}

export function rememberFailure(failures: FailureEvent[], event: FailureEvent): FailureEvent[] {
  return [...failures, event].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}

export function createEvolutionCandidate(input: {
  hypothesis: string;
  failures: FailureEvent[];
  counterfactuals: CounterfactualResult[];
  challenger: ChallengerResult;
  shadow?: ShadowComparison;
}): EvolutionCandidate {
  return {
    hypothesis: input.hypothesis,
    failureIds: input.failures.map((failure) => failure.id),
    counterfactuals: input.counterfactuals,
    challenger: input.challenger,
    ...(input.shadow ? { shadow: input.shadow } : {}),
    promotion: evaluatePromotion(input.shadow, input.challenger.passed, input.counterfactuals),
    authorizationRequired: true,
  };
}

export function negotiatePreparedSlot(input: {
  requestedDate?: string;
  requestedTime?: string;
  availableSlots: AppointmentSlot[];
}): { status: "match" | "alternatives" | "none"; selected?: AppointmentSlot; alternatives: AppointmentSlot[] } {
  const matches = input.availableSlots.filter((slot) => (!input.requestedDate || slot.date === input.requestedDate) && (!input.requestedTime || slot.time === input.requestedTime));
  if (matches.length) return { status: "match", selected: matches[0], alternatives: matches.slice(1) };
  const alternatives = input.availableSlots.filter((slot) => !input.requestedDate || slot.date === input.requestedDate).slice(0, 3);
  return alternatives.length ? { status: "alternatives", alternatives } : { status: "none", alternatives: [] };
}

export const NON_IMPLEMENTED_RESEARCH_TRACKS = [
  "full neural NAS / mutagenesis", "MAML", "DPO", "federated learning", "model distillation", "latent-space agent communication", "full chaos monkey", "quantum or neuromorphic hardware",
] as const;
