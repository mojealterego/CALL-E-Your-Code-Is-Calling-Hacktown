import { createHash } from "node:crypto";
import type { CallOutcome, Incident } from "./domain.js";

export type EpistemicStatus = "TRUE" | "FALSE" | "UNKNOWN" | "UNVERIFIED" | "CONTRADICTED" | "STALE";
export type ClaimSource = "call-e" | "authoritative-system" | "derived" | "human";

export interface ClaimEvidence {
  claim: string;
  value: string;
  source: ClaimSource;
  evidence: string[];
  confidence: "high" | "medium" | "low" | "unknown";
  authority: "authoritative" | "conversational" | "derived";
  verified: boolean;
  status: EpistemicStatus;
  timestamp: string;
  provenance: string[];
}
export interface ClaimLedger { claims: ClaimEvidence[]; verified: ClaimEvidence[]; conflicts: ClaimEvidence[]; commitAllowed: boolean; }
export interface EvidenceNode extends ClaimEvidence { id: string; }
export interface EvidenceGraph { root: string; nodes: EvidenceNode[]; edges: Array<{ from: string; to: string; relation: "supports" | "derived-from" | "conflicts-with" }>; }
export interface MonitorabilityScore { identity: number; appointment: number; doctor: number; decision: number; availability: number; completion: number; evidence: number; overall: number; action: "normal reconciliation" | "additional verification" | "recover / human review"; }
export interface TrajectoryEvent { type: "observation" | "retrieval" | "model_output" | "tool_selection" | "state_update" | "retry" | "escalation" | "side_effect"; detail: string; safe: boolean; }
export interface ConversationContract {
  version: 1;
  identity: { subject: string };
  objective: { confirmAppointment: true };
  allowedActions: readonly ["confirm", "reschedule", "cancel"];
  forbiddenActions: readonly ["invent_availability", "invent_medical_information", "disclose_before_identity", "modify_unprepared_slot"];
  requiredEvidence: readonly ["patient_identity", "appointment_decision", "doctor", "conversation_completion"];
  conditionalEvidence: { firstVisitYes: readonly ["identity_document_reminder", "arrive_30_minutes_early", "registration", "information_form"]; firstVisitNo: readonly [] };
  commitConditions: readonly ["patient_confirmed", "appointment_or_reschedule_verified", "provider_completed", "conversation_completed", "no_conflicts"];
  digest: string;
}
export interface PreparedState { slot: string; slotVersion: number; stateVersion: number; preparedAt: string; }
export interface AuthoritativeReadback { slot: string; slotVersion: number; stateVersion: number; readbackAt: string; }
export interface CompoundReasoningResult { agreement: number; disagreement: number; interpretations: Array<{ parser: string; claims: ClaimEvidence[] }>; earlyExit: boolean; action: "confidence-signal" | "recover"; }

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function buildConversationContract(incident: Incident): ConversationContract {
  const body = {
    identity: { subject: incident.requestedBy }, objective: { confirmAppointment: true },
    allowedActions: ["confirm", "reschedule", "cancel"] as const,
    forbiddenActions: ["invent_availability", "invent_medical_information", "disclose_before_identity", "modify_unprepared_slot"] as const,
    requiredEvidence: ["patient_identity", "appointment_decision", "doctor", "conversation_completion"] as const,
    conditionalEvidence: { firstVisitYes: ["identity_document_reminder", "arrive_30_minutes_early", "registration", "information_form"] as const, firstVisitNo: [] as const },
    commitConditions: ["patient_confirmed", "appointment_or_reschedule_verified", "provider_completed", "conversation_completed", "no_conflicts"] as const,
  };
  return { version: 1, ...body, digest: digest(body) };
}

export function buildClaimLedger(outcome: CallOutcome, callId?: string, timestamp = new Date().toISOString()): ClaimLedger {
  const evidenceBase = ["structured_result", ...(callId ? [`call_id:${callId}`] : [])];
  const claims: ClaimEvidence[] = [
    { claim: "appointment_decision", value: outcome.route_acceptance, source: "call-e", evidence: evidenceBase, confidence: outcome.confidence, authority: "conversational", verified: false, status: "UNVERIFIED", timestamp, provenance: ["call-e", "structured_result"] },
    { claim: "appointment_time", value: outcome.eta_update_time, source: "call-e", evidence: evidenceBase, confidence: outcome.confidence, authority: "conversational", verified: false, status: outcome.eta_update_time ? "UNVERIFIED" : "UNKNOWN", timestamp, provenance: ["call-e", "structured_result"] },
    { claim: "escalation", value: outcome.escalation_needed, source: "call-e", evidence: evidenceBase, confidence: outcome.confidence, authority: "conversational", verified: false, status: "UNVERIFIED", timestamp, provenance: ["call-e", "structured_result"] },
    { claim: "conversation_completion", value: "true", source: "call-e", evidence: evidenceBase, confidence: outcome.confidence, authority: "conversational", verified: false, status: "UNVERIFIED", timestamp, provenance: ["call-e", "structured_result"] },
  ];
  const verified = outcome.route_acceptance === "yes" && Boolean(outcome.eta_update_time.trim()) && outcome.escalation_needed === "none" && Boolean(outcome.evidence_summary.trim()) && outcome.confidence === "high";
  const finalClaims = claims.map(c => ({ ...c, verified, status: verified ? "TRUE" as const : c.status }));
  return { claims: finalClaims, verified: finalClaims.filter(c => c.verified), conflicts: [], commitAllowed: verified };
}

export function buildEvidenceGraph(ledger: ClaimLedger): EvidenceGraph {
  const root = "call-transaction";
  const nodes = ledger.claims.map(c => ({ ...c, id: digest({ claim: c.claim, value: c.value, timestamp: c.timestamp }) }));
  const edges: EvidenceGraph["edges"] = nodes.map(n => ({ from: root, to: n.id, relation: n.status === "CONTRADICTED" ? "conflicts-with" : n.source === "derived" ? "derived-from" : "supports" }));
  return { root, nodes, edges };
}

export function scoreMonitorability(ledger: ClaimLedger, graph: EvidenceGraph): MonitorabilityScore {
  const value = (claim: string) => ledger.claims.find(c => c.claim === claim)?.verified ? 1 : ledger.claims.find(c => c.claim === claim)?.status === "UNKNOWN" ? 0 : 0.5;
  const score = {
    identity: 1,
    appointment: value("appointment_decision"),
    doctor: 1,
    decision: value("appointment_decision"),
    availability: value("appointment_time"),
    completion: value("conversation_completion"),
    evidence: clamp01(ledger.claims.length > 0 && ledger.claims.some(c => c.verified) ? 1 : 0),
  };
  const overall = Number((Object.values(score).reduce((a, b) => a + b, 0) / Object.keys(score).length).toFixed(2));
  return { ...score, overall, action: overall >= 0.9 ? "normal reconciliation" : overall >= 0.7 ? "additional verification" : "recover / human review" };
}

export function evaluateTrajectory(events: TrajectoryEvent[]): { safe: boolean; violations: string[] } {
  const violations: string[] = []; let sideEffects = 0;
  for (const event of events) { if (!event.safe) violations.push(`${event.type}:${event.detail}`); if (event.type === "side_effect") sideEffects++; if (event.type === "retry" && sideEffects > 0) violations.push("retry-after-side-effect"); }
  if (sideEffects > 1) violations.push("multiple-side-effects");
  return { safe: violations.length === 0, violations };
}

export function compoundReasoning(parsers: Array<{ name: string; claims: ClaimEvidence[] }>): CompoundReasoningResult {
  if (parsers.length === 0) return { agreement: 0, disagreement: 0, interpretations: [], earlyExit: false, action: "recover" };
  const byClaim = new Map<string, string[]>();
  for (const parser of parsers) for (const claim of parser.claims) byClaim.set(claim.claim, [...(byClaim.get(claim.claim) ?? []), claim.value]);
  let agreements = 0; let disagreements = 0;
  for (const values of byClaim.values()) values.length > 0 && new Set(values).size === 1 ? agreements++ : disagreements++;
  const total = agreements + disagreements; const agreement = total ? agreements / total : 0; const disagreement = total ? disagreements / total : 0;
  return { agreement, disagreement, interpretations: parsers, earlyExit: agreement === 1, action: disagreement === 0 ? "confidence-signal" : "recover" };
}

export function reconcileStaleState(prepared: PreparedState, readback: AuthoritativeReadback): { status: "CURRENT" | "STALE"; action: "COMMIT" | "RECOVER" } {
  const current = prepared.slotVersion === readback.slotVersion && prepared.stateVersion === readback.stateVersion && prepared.slot === readback.slot;
  return current ? { status: "CURRENT", action: "COMMIT" } : { status: "STALE", action: "RECOVER" };
}

export function conserveExternalSideEffect(existingCallId: string | undefined, requestedNewExecution: boolean): { allowed: boolean; action: "RECONCILE_EXISTING" | "EXECUTE_ONCE" | "REJECT_DUPLICATE" } {
  if (existingCallId) return { allowed: false, action: "RECONCILE_EXISTING" };
  if (!requestedNewExecution) return { allowed: false, action: "REJECT_DUPLICATE" };
  return { allowed: true, action: "EXECUTE_ONCE" };
}

export function classifyClaim(_value: string, evidence: string[], verified: boolean, fresh: boolean, contradicted: boolean): EpistemicStatus {
  if (contradicted) return "CONTRADICTED";
  if (!fresh) return "STALE";
  if (verified) return "TRUE";
  if (!evidence.length) return "UNKNOWN";
  return "UNVERIFIED";
}
