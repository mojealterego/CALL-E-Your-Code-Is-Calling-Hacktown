import { createHash } from "node:crypto";
import {
  buildAssuranceContext,
  buildClaimLedger,
  buildEvidenceGraph,
  buildConversationContract,
  evaluateTrajectory,
  formalGate,
  type Claim,
  type TrajectoryEvent,
} from "./assurance.js";

export type DecisionAction = "commit" | "abort" | "recover";
export type AutonomyState = "normal" | "degraded" | "restricted" | "recovery-only" | "human-review";
export type NegotiationStatus = "accepted" | "next-option" | "clarify" | "exhausted" | "cancelled";

export interface DecisionOption { id: string; date: string; time: string; prepared: boolean; preferenceScore: number; riskScore: number; }
export interface NegotiationResult { status: NegotiationStatus; selected?: DecisionOption; next?: DecisionOption; clarification?: string; considered: string[]; }
export interface DecisionMetrics { failureRate: number; unknownRate: number; recoveryRate: number; contradictionRate: number; providerErrorRate: number; verificationFailureRate: number; duplicateAttemptRate: number; confidence: number; latencyMs: number; }
export interface RiskConfidence { risk: number; confidence: number; reasons: string[]; }
export interface CapabilityAdapter { provider: string; operation: string; authorized: boolean; participant: string; endpoint: string; idempotencyKey: string; }
export interface DecisionReceipt { receiptId: string; action: DecisionAction; transactionDigest: string; evidenceDigest: string; decisionDigest: string; }
export interface DecisionLoopInput { intent: string; patientName: string; doctorName: string; appointmentDate: string; appointmentTime: string; claims: Claim[]; trajectory: TrajectoryEvent[]; providerTerminal: boolean; taskCompleted: boolean; conversationCompleted: boolean; patientConfirmed?: string; appointmentDecision?: string; evidenceItems: string[]; selectedSlotPrepared: boolean; contradiction?: boolean; metrics?: DecisionMetrics; capability?: CapabilityAdapter; }
export interface DecisionLoopResult { action: DecisionAction; autonomy: AutonomyState; allowed: boolean; riskConfidence: RiskConfidence; adversarialChecks: string[]; receipt?: DecisionReceipt; recoveryReason?: string; }

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function digest(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export function negotiatePreparedOptions(preferredDate: string, preferredTime: string | undefined, options: DecisionOption[]): NegotiationResult {
  const prepared = options.filter((option) => option.prepared); const considered: string[] = [];
  if (!prepared.length) return { status: "exhausted", considered };
  const ranked = [...prepared].sort((a, b) => { const aExact = a.date === preferredDate && a.time === preferredTime ? 1 : 0; const bExact = b.date === preferredDate && b.time === preferredTime ? 1 : 0; return bExact - aExact || b.preferenceScore - a.preferenceScore || a.riskScore - b.riskScore; });
  for (const option of ranked) considered.push(option.id);
  const exact = ranked.find((option) => option.date === preferredDate && option.time === preferredTime);
  if (exact) return { status: "accepted", selected: exact, considered };
  const next = ranked.find((option) => option.date === preferredDate);
  if (next) return { status: "next-option", next, considered };
  return { status: "clarify", clarification: "Czy odpowiada Panu któryś z przygotowanych terminów?", next: ranked[0], considered };
}

export function clarifyAppointmentResponse(text: string, knownDates: string[], knownTimes: string[]): { kind: "date" | "time" | "unknown"; value?: string } { const normalized = text.trim().toLowerCase(); const date = knownDates.find((candidate) => normalized.includes(candidate.toLowerCase())); if (date) return { kind: "date", value: date }; const time = knownTimes.find((candidate) => normalized.includes(candidate.toLowerCase())); if (time) return { kind: "time", value: time }; return { kind: "unknown" }; }

export function scoreRiskConfidence(input: { evidenceCount: number; requiredEvidenceCount: number; contradiction: boolean; trajectorySafe: boolean; providerTerminal: boolean; taskCompleted: boolean; conversationCompleted: boolean; selectedSlotPrepared: boolean; metrics?: DecisionMetrics; }): RiskConfidence {
  const reasons: string[] = []; const evidenceCoverage = input.requiredEvidenceCount > 0 ? clamp01(input.evidenceCount / input.requiredEvidenceCount) : 0; let confidence = 0.2 + evidenceCoverage * 0.3; let risk = 0.2;
  if (input.providerTerminal) confidence += 0.15; else { risk += 0.3; reasons.push("provider-not-terminal"); }
  if (input.taskCompleted) confidence += 0.1; else { risk += 0.2; reasons.push("task-not-completed"); }
  if (input.conversationCompleted) confidence += 0.1; else { risk += 0.2; reasons.push("conversation-not-completed"); }
  if (input.selectedSlotPrepared) confidence += 0.05; else { risk += 0.25; reasons.push("slot-not-prepared"); }
  if (input.contradiction) { risk += 0.35; confidence -= 0.3; reasons.push("contradiction"); }
  if (!input.trajectorySafe) { risk += 0.25; confidence -= 0.2; reasons.push("trajectory-violation"); }
  if (input.metrics) { risk += clamp01(input.metrics.failureRate) * 0.15; risk += clamp01(input.metrics.verificationFailureRate) * 0.15; risk += clamp01(input.metrics.duplicateAttemptRate) * 0.15; confidence -= clamp01(input.metrics.unknownRate) * 0.1; confidence -= clamp01(input.metrics.contradictionRate) * 0.1; }
  return { risk: Number(clamp01(risk).toFixed(3)), confidence: Number(clamp01(confidence).toFixed(3)), reasons };
}

export function decisionMatrix(input: { identityVerified: boolean; appointmentVerified: boolean; providerTerminal: boolean; taskCompleted: boolean; conversationCompleted: boolean; evidencePresent: boolean; noContradiction: boolean; slotPrepared: boolean; trajectorySafe: boolean; }): { action: DecisionAction; failed: string[] } {
  const failed: string[] = []; if (!input.identityVerified) failed.push("identity-not-verified"); if (!input.appointmentVerified) failed.push("appointment-not-verified"); if (!input.providerTerminal) failed.push("provider-not-terminal"); if (!input.taskCompleted) failed.push("task-not-completed"); if (!input.conversationCompleted) failed.push("conversation-not-completed"); if (!input.evidencePresent) failed.push("evidence-missing"); if (!input.noContradiction) failed.push("contradiction"); if (!input.slotPrepared) failed.push("slot-not-prepared"); if (!input.trajectorySafe) failed.push("trajectory-unsafe"); return failed.length ? { action: "recover", failed } : { action: "commit", failed };
}

export function adversarialDecisionChecks(input: { identityVerified: boolean; appointmentVerified: boolean; slotPrepared: boolean; stateFresh: boolean; callKnown: boolean; evidencePresent: boolean; contradiction: boolean; authoritativeReadback: boolean; }): string[] {
  const failures: string[] = []; if (!input.identityVerified) failures.push("IDENTITY_NOT_VERIFIED→NEVER_DISCLOSE"); if (!input.appointmentVerified) failures.push("APPOINTMENT_NOT_VERIFIED→NEVER_COMMIT"); if (!input.slotPrepared) failures.push("SLOT_NOT_IN_PREPARED_AVAILABILITY→NEVER_COMMIT"); if (!input.stateFresh) failures.push("BITEMPORAL_STATE_STALE→RECOVER"); if (!input.callKnown) failures.push("CALL_STATE_UNKNOWN→NEVER_CREATE_SECOND_CALL"); if (input.contradiction) failures.push("CONTRADICTION→RECOVER"); if (!input.authoritativeReadback) failures.push("AUTHORITATIVE_READBACK_MISSING→NEVER_COMMIT"); if (!input.evidencePresent) failures.push("REQUIRED_EVIDENCE_MISSING→NEVER_COMMIT"); return failures;
}

export function classifyAutonomy(metrics: DecisionMetrics): AutonomyState { const severe = metrics.failureRate >= 0.3 || metrics.providerErrorRate >= 0.3 || metrics.verificationFailureRate >= 0.3 || metrics.duplicateAttemptRate >= 0.1; const degraded = metrics.failureRate >= 0.15 || metrics.unknownRate >= 0.2 || metrics.contradictionRate >= 0.15; const restricted = metrics.recoveryRate >= 0.4 || metrics.confidence < 0.65; if (severe) return "human-review"; if (restricted) return "recovery-only"; if (degraded) return "restricted"; if (metrics.failureRate > 0 || metrics.unknownRate > 0) return "degraded"; return "normal"; }

export function buildCapabilityAdapter(input: { provider: string; operation: string; participant: string; endpoint: string; constraints: string[] }): CapabilityAdapter { return { provider: input.provider, operation: input.operation, authorized: input.constraints.length > 0, participant: input.participant, endpoint: input.endpoint, idempotencyKey: `tx_${digest({ provider: input.provider, operation: input.operation, participant: input.participant, endpoint: input.endpoint, constraints: input.constraints }).slice(0, 24)}` }; }
export function buildFailureMemory(metrics: DecisionMetrics, reasons: string[]): { kind: "failure"; severity: "low" | "medium" | "high"; facts: string[] } { const severity = metrics.failureRate >= 0.3 || metrics.verificationFailureRate >= 0.3 ? "high" : metrics.failureRate > 0 || reasons.length > 0 ? "medium" : "low"; return { kind: "failure", severity, facts: [...new Set(reasons)] }; }
export function trajectoryMetrics(events: TrajectoryEvent[]): { sideEffects: number; unsafeEvents: number; retriesAfterSideEffect: number; safe: boolean } { let sideEffects = 0; let unsafeEvents = 0; let retriesAfterSideEffect = 0; for (const event of events) { if (event.type === "side_effect") sideEffects += 1; if (!event.safe) unsafeEvents += 1; if (event.type === "retry" && sideEffects > 0) retriesAfterSideEffect += 1; } return { sideEffects, unsafeEvents, retriesAfterSideEffect, safe: sideEffects <= 1 && unsafeEvents === 0 && retriesAfterSideEffect === 0 }; }
export function buildDecisionReceipt(input: { action: DecisionAction; transaction: unknown; evidence: unknown }): DecisionReceipt { const transactionDigest = digest(input.transaction); const evidenceDigest = digest(input.evidence); const decisionDigest = digest({ transactionDigest, evidenceDigest, action: input.action }); return { receiptId: `receipt_${decisionDigest.slice(0, 16)}`, action: input.action, transactionDigest, evidenceDigest, decisionDigest }; }

export function runMetaArchitectDecisionLoop(input: DecisionLoopInput): DecisionLoopResult {
  const trajectory = evaluateTrajectory(input.trajectory);
  const context = buildAssuranceContext({ patientName: input.patientName, doctorName: input.doctorName, appointmentDate: input.appointmentDate, appointmentTime: input.appointmentTime, appointmentDecision: input.appointmentDecision, patientConfirmed: input.patientConfirmed, evidenceSummary: input.evidenceItems.join("; "), evidenceItems: input.evidenceItems });
  // The runtime context must evaluate the claims actually supplied by the
  // provider reconciliation layer. Synthetic context claims remain unverified.
  context.claims = input.claims;
  context.claimLedger = buildClaimLedger(input.claims);
  context.evidenceGraph = buildEvidenceGraph(context.claimLedger);
  const formal = formalGate({ decision: "commit", patientConfirmed: input.patientConfirmed, appointmentDecision: input.appointmentDecision, providerStatus: input.providerTerminal ? "completed" : "unknown", taskCompleted: input.taskCompleted, conversationCompleted: input.conversationCompleted, evidenceItems: input.evidenceItems, selectedSlotPrepared: input.selectedSlotPrepared, contradiction: input.contradiction });
  const identityVerified = input.patientConfirmed === "yes";
  const appointmentVerified = input.appointmentDecision === "confirm" || (input.appointmentDecision === "reschedule" && input.selectedSlotPrepared);
  const checks = adversarialDecisionChecks({ identityVerified, appointmentVerified, slotPrepared: input.selectedSlotPrepared, stateFresh: true, callKnown: Boolean(input.capability), evidencePresent: input.evidenceItems.length > 0, contradiction: input.contradiction === true, authoritativeReadback: input.providerTerminal });
  const metrics = input.metrics ?? { failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateAttemptRate: 0, confidence: 1, latencyMs: 0 };
  const autonomy = classifyAutonomy(metrics);
  const rc = scoreRiskConfidence({ evidenceCount: input.evidenceItems.length, requiredEvidenceCount: 4, contradiction: input.contradiction === true, trajectorySafe: trajectory.safe, providerTerminal: input.providerTerminal, taskCompleted: input.taskCompleted, conversationCompleted: input.conversationCompleted, selectedSlotPrepared: input.selectedSlotPrepared, metrics });
  const matrix = decisionMatrix({ identityVerified, appointmentVerified, providerTerminal: input.providerTerminal, taskCompleted: input.taskCompleted, conversationCompleted: input.conversationCompleted, evidencePresent: input.evidenceItems.length > 0, noContradiction: input.contradiction !== true, slotPrepared: input.selectedSlotPrepared, trajectorySafe: trajectory.safe });
  const allowed = input.capability?.authorized === true && formal.allowed && context.claimLedger.commitAllowed && checks.length === 0 && matrix.action === "commit" && autonomy === "normal" && rc.confidence >= 0.75 && rc.risk < 0.3;
  if (!allowed) return { action: checks.some((check) => check.includes("CONTRADICTION") || check.includes("STALE") || check.includes("UNKNOWN")) ? "recover" : "abort", autonomy, allowed: false, riskConfidence: rc, adversarialChecks: [...checks, ...matrix.failed], recoveryReason: [...checks, ...matrix.failed].join("; ") || "formal-gate-denied" };
  const receipt = buildDecisionReceipt({ action: "commit", transaction: { intent: input.intent, patientName: input.patientName, doctorName: input.doctorName, appointmentDate: input.appointmentDate, appointmentTime: input.appointmentTime }, evidence: { claims: input.claims, evidenceItems: input.evidenceItems, providerTerminal: input.providerTerminal } });
  return { action: "commit", autonomy, allowed: true, riskConfidence: rc, adversarialChecks: [], receipt };
}

export function buildConversationContractDigest(patientName: string): string { return buildConversationContract(patientName).digest; }
