import type { AppointmentSlot } from "./domain.js";

export type AssuranceMode = "normal" | "degraded" | "restricted" | "recovery-only" | "human-review";
export type PromotionDecision = "reject" | "shadow" | "candidate";
export type TrustLevel = "trusted" | "degraded" | "restricted" | "untrusted";
export type FailureCategory = "unknown" | "contradiction" | "provider" | "verification" | "duplicate" | "timeout" | "policy" | "other";
export interface FailureEvent { id: string; category: FailureCategory; summary: string; occurredAt: string; transactionId?: string; }
export interface AssuranceMetrics { failureRate: number; unknownRate: number; recoveryRate: number; contradictionRate: number; providerErrorRate: number; verificationFailureRate: number; duplicateExecutionAttempts: number; latencyMs: number; confidenceDegradation: number; }
export interface SystemStateManifest { version: string; provider: string; capabilities: string[]; authorizationScope: string[]; policyVersion: string; knownFailures: string[]; assuranceMode: AssuranceMode; verificationState: "verified" | "unverified" | "failed"; constraints: string[]; promotionState: "baseline" | "shadow" | "candidate" | "rejected"; generatedAt: string; trustLevel?: TrustLevel; authorizationDecision?: "allowed" | "denied" | "unknown"; freshnessState?: "fresh" | "stale" | "unknown"; }
export interface CounterfactualResult { question: string; counterexampleFound: boolean; severity: "none" | "medium" | "high" | "critical"; reason: string; }
export interface ChallengerResult { challengedDecision: "commit" | "abort" | "recover"; objections: string[]; passed: boolean; }
export interface ShadowRun { reliability: number; verificationCoverage: number; latencyMs: number; cost: number; }
export interface ShadowComparison { baseline: ShadowRun; candidate: ShadowRun; reliabilityDelta: number; verificationCoverageDelta: number; latencyDeltaMs: number; costDelta: number; candidateDominates: boolean; }
export interface EvolutionCandidate { hypothesis: string; failureIds: string[]; counterfactuals: CounterfactualResult[]; challenger: ChallengerResult; shadow?: ShadowComparison; promotion: PromotionDecision; authorizationRequired: true; }
export interface ReplayCase { id: string; decision: "commit" | "abort" | "recover"; identityVerified: boolean; authoritativeCompleted: boolean; evidencePresent: boolean; selectedSlotPrepared: boolean; contradiction: boolean; expectedSafeDecision: "commit" | "abort" | "recover"; }
export interface ReplayResult { caseId: string; actualDecision: "commit" | "abort" | "recover"; expectedSafeDecision: "commit" | "abort" | "recover"; passed: boolean; objections: string[]; }
export interface ProviderHandshake { provider: string; schemaVersion: string; capabilities: string[]; supportedOperations: string[]; verificationSemantics: "authoritative-readback" | "unverified"; idempotency: "supported" | "unsupported"; limitsKnown: boolean; accepted: boolean; reasons: string[]; }
export interface SemanticCacheEntry { key: string; value: string; recordedAt: string; expiresAt: string; sourceRefs: string[]; authorizationEligible: false; }
export interface FreshnessResult { state: "fresh" | "stale" | "unknown"; ageMs: number | null; reason: string; }
export interface SandboxArtifact { id: string; createdAt: string; expiresAt: string; destroyed: boolean; }

export const SAFETY_INVARIANTS = [
  "CAPABILITY_NEVER_GRANTS_AUTHORIZATION",
  "UNKNOWN_NEVER_MEANS_SUCCESS",
  "UNVERIFIED_NEVER_COMMITS",
  "ONE_LOGICAL_TRANSACTION_MAX_ONE_EXTERNAL_EXECUTION",
  "WEBHOOK_NEVER_AUTHORIZES_STATE_MUTATION",
  "PREPARED_AVAILABILITY_ONLY",
  "MEMORY_NEVER_AUTHORIZES_EXECUTION",
] as const;

export function assuranceHomeostasis(metrics: AssuranceMetrics): AssuranceMode {
  if (metrics.verificationFailureRate >= 0.25 || metrics.duplicateExecutionAttempts > 0) return "human-review";
  if (metrics.contradictionRate >= 0.20 || metrics.unknownRate >= 0.30) return "recovery-only";
  if (metrics.failureRate >= 0.20 || metrics.providerErrorRate >= 0.20) return "restricted";
  if (metrics.failureRate >= 0.10 || metrics.confidenceDegradation >= 0.20) return "degraded";
  return "normal";
}

export function counterfactualCheck(input: { decision: "commit" | "abort" | "recover"; identityVerified: boolean; authoritativeCompleted: boolean; evidencePresent: boolean; selectedSlotPrepared: boolean; contradiction: boolean; }): CounterfactualResult[] {
  const checks: CounterfactualResult[] = [
    { question: "What if identity was not actually verified?", counterexampleFound: !input.identityVerified, severity: !input.identityVerified ? "critical" : "none", reason: !input.identityVerified ? "Identity proof is absent." : "Identity invariant holds." },
    { question: "What if the provider did not complete the operation?", counterexampleFound: !input.authoritativeCompleted, severity: !input.authoritativeCompleted ? "critical" : "none", reason: !input.authoritativeCompleted ? "Authoritative completion is absent." : "Provider is terminal." },
    { question: "What if the result has no evidence?", counterexampleFound: !input.evidencePresent, severity: !input.evidencePresent ? "high" : "none", reason: !input.evidencePresent ? "No evidence can support commit." : "Evidence exists." },
    { question: "What if a replacement slot was invented?", counterexampleFound: !input.selectedSlotPrepared, severity: !input.selectedSlotPrepared ? "high" : "none", reason: !input.selectedSlotPrepared ? "Replacement slot is outside prepared availability." : "Replacement slot is prepared." },
    { question: "What if two claims contradict each other?", counterexampleFound: input.contradiction, severity: input.contradiction ? "high" : "none", reason: input.contradiction ? "Contradictory claims exist." : "No contradiction detected." },
  ];
  return input.decision === "commit" ? checks : checks.filter((check) => check.counterexampleFound);
}

export function challengeDecision(input: { decision: "commit" | "abort" | "recover"; identityVerified: boolean; authoritativeCompleted: boolean; evidencePresent: boolean; contradiction: boolean; }): ChallengerResult {
  const objections: string[] = [];
  if (input.decision === "commit" && !input.identityVerified) objections.push("Identity is not verified.");
  if (input.decision === "commit" && !input.authoritativeCompleted) objections.push("Provider completion is not authoritative.");
  if (input.decision === "commit" && !input.evidencePresent) objections.push("Evidence is missing.");
  if (input.decision === "commit" && input.contradiction) objections.push("Claims contradict.");
  return { challengedDecision: input.decision, objections, passed: objections.length === 0 };
}

export function compareShadowRuns(baseline: ShadowRun, candidate: ShadowRun): ShadowComparison {
  const reliabilityDelta = candidate.reliability - baseline.reliability;
  const verificationCoverageDelta = candidate.verificationCoverage - baseline.verificationCoverage;
  const latencyDeltaMs = candidate.latencyMs - baseline.latencyMs;
  const costDelta = candidate.cost - baseline.cost;
  const candidateDominates = reliabilityDelta >= 0 && verificationCoverageDelta >= 0 && latencyDeltaMs <= 0 && costDelta <= 0 && (reliabilityDelta > 0 || verificationCoverageDelta > 0 || latencyDeltaMs < 0 || costDelta < 0);
  return { baseline, candidate, reliabilityDelta, verificationCoverageDelta, latencyDeltaMs, costDelta, candidateDominates };
}

export function evaluatePromotion(shadow: ShadowComparison | undefined, challengerPassed: boolean, counterfactuals: CounterfactualResult[]): PromotionDecision {
  if (!challengerPassed || counterfactuals.some((c) => c.severity === "critical")) return "reject";
  if (!shadow) return "shadow";
  return shadow.candidateDominates ? "candidate" : "shadow";
}

export function buildSystemStateManifest(input: Omit<SystemStateManifest, "generatedAt">): SystemStateManifest { return { ...input, generatedAt: new Date().toISOString() }; }
export function rememberFailure(failures: FailureEvent[], event: FailureEvent): FailureEvent[] { return [...failures, event].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index); }

export function classifyFailure(input: { unknown?: boolean; contradiction?: boolean; providerError?: boolean; verificationFailure?: boolean; duplicate?: boolean; timeout?: boolean; policyViolation?: boolean }): FailureCategory {
  if (input.duplicate) return "duplicate";
  if (input.verificationFailure) return "verification";
  if (input.policyViolation) return "policy";
  if (input.contradiction) return "contradiction";
  if (input.unknown) return "unknown";
  if (input.providerError) return "provider";
  if (input.timeout) return "timeout";
  return "other";
}

export function replayAssuranceCases(cases: ReplayCase[]): ReplayResult[] {
  return cases.map((testCase) => {
    const challenger = challengeDecision(testCase);
    const counterfactuals = counterfactualCheck(testCase);
    const unsafe = counterfactuals.some((item) => item.counterexampleFound && item.severity === "critical") || !challenger.passed;
    const actualDecision = unsafe ? "recover" : testCase.decision;
    return { caseId: testCase.id, actualDecision, expectedSafeDecision: testCase.expectedSafeDecision, passed: actualDecision === testCase.expectedSafeDecision, objections: challenger.objections };
  });
}

export function detectDrift(baseline: number[], current: number[], threshold = 0.20): { drifted: boolean; distance: number } {
  if (baseline.length === 0 || current.length === 0) return { drifted: false, distance: 0 };
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const distance = Math.abs(mean(current) - mean(baseline));
  return { drifted: distance >= threshold, distance };
}

export function degradeTrust(current: TrustLevel, failure: FailureCategory): TrustLevel {
  if (failure === "duplicate" || failure === "verification" || failure === "policy") return "untrusted";
  if (current === "trusted") return "degraded";
  if (current === "degraded") return "restricted";
  if (current === "restricted") return "untrusted";
  return "untrusted";
}

export function authorizationFromTrust(trust: TrustLevel, requested: boolean): "allowed" | "denied" | "unknown" {
  if (!requested) return "unknown";
  return trust === "trusted" ? "allowed" : "denied";
}

export function createSemanticCacheEntry(key: string, value: string, ttlMs: number, sourceRefs: string[], now = new Date()): SemanticCacheEntry {
  return { key, value, recordedAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString(), sourceRefs, authorizationEligible: false };
}

export function evaluateFreshness(recordedAt: string | undefined, now = new Date(), maxAgeMs = 5 * 60_000): FreshnessResult {
  if (!recordedAt) return { state: "unknown", ageMs: null, reason: "No temporal record exists." };
  const ageMs = now.getTime() - new Date(recordedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return { state: "unknown", ageMs: null, reason: "Temporal record is invalid or from the future." };
  return ageMs <= maxAgeMs ? { state: "fresh", ageMs, reason: "Recorded state is within the freshness window." } : { state: "stale", ageMs, reason: "Recorded state exceeds the freshness window." };
}

export function providerHandshake(input: Omit<ProviderHandshake, "accepted" | "reasons">): ProviderHandshake {
  const reasons: string[] = [];
  if (input.verificationSemantics !== "authoritative-readback") reasons.push("Authoritative readback is unavailable.");
  if (input.idempotency !== "supported") reasons.push("Provider idempotency is unavailable.");
  if (!input.limitsKnown) reasons.push("Provider limits are not known.");
  return { ...input, accepted: reasons.length === 0, reasons };
}

export function loadShedding(mode: AssuranceMode, loadRatio: number): { mode: AssuranceMode; dropOptionalWork: boolean; preserveVerification: true } {
  if (loadRatio <= 0.80) return { mode, dropOptionalWork: false, preserveVerification: true };
  const degraded = mode === "normal" ? "degraded" : mode;
  return { mode: degraded, dropOptionalWork: true, preserveVerification: true };
}

export function createSandboxArtifact(id: string, ttlMs: number, now = new Date()): SandboxArtifact {
  return { id, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString(), destroyed: false };
}
export function destroySandboxArtifact(artifact: SandboxArtifact): SandboxArtifact { return { ...artifact, destroyed: true }; }

export function createEvolutionCandidate(input: { hypothesis: string; failures: FailureEvent[]; counterfactuals: CounterfactualResult[]; challenger: ChallengerResult; shadow?: ShadowComparison; }): EvolutionCandidate { return { hypothesis: input.hypothesis, failureIds: input.failures.map((failure) => failure.id), counterfactuals: input.counterfactuals, challenger: input.challenger, ...(input.shadow ? { shadow: input.shadow } : {}), promotion: evaluatePromotion(input.shadow, input.challenger.passed, input.counterfactuals), authorizationRequired: true }; }

export function negotiatePreparedSlot(input: { requestedDate?: string; requestedTime?: string; availableSlots: AppointmentSlot[]; }): { status: "match" | "alternatives" | "none"; selected?: AppointmentSlot; alternatives: AppointmentSlot[] } {
  const matches = input.availableSlots.filter((slot) => (!input.requestedDate || slot.date === input.requestedDate) && (!input.requestedTime || slot.time === input.requestedTime));
  if (matches.length > 0) {
    const selected = matches[0];
    if (!selected) throw new Error("Invariant violation: matched appointment slot missing");
    return { status: "match", selected, alternatives: matches.slice(1) };
  }
  const alternatives = input.availableSlots.filter((slot) => !input.requestedDate || slot.date === input.requestedDate).slice(0, 3);
  return alternatives.length > 0 ? { status: "alternatives", alternatives } : { status: "none", alternatives: [] };
}

export const NON_IMPLEMENTED_RESEARCH_TRACKS = ["full neural NAS / mutagenesis", "MAML", "DPO", "federated learning", "model distillation", "latent-space agent communication", "full chaos monkey", "quantum or neuromorphic hardware"] as const;
