import { createHash } from "node:crypto";

export type EpistemicStatus = "true" | "false" | "unknown" | "unverified" | "contradicted" | "stale" | "verified";
export type MemoryKind = "working" | "episodic" | "semantic" | "procedural" | "holographic";
export type ClaimSource = "call-e" | "memory" | "policy" | "authoritative" | "derived" | "human";
export type ClaimAuthority = "conversational" | "authoritative" | "derived";

export interface Claim {
  id: string;
  subject: string;
  predicate: string;
  value: string;
  status: EpistemicStatus;
  source: ClaimSource;
  authority: ClaimAuthority;
  evidenceRefs: string[];
  confidence: number;
  validFrom: string;
  validTo?: string;
  recordedAt: string;
  provenance: string[];
}

export interface ClaimLedger {
  claims: Claim[];
  verified: Claim[];
  conflicts: Claim[];
  commitAllowed: boolean;
}

export interface EvidenceNode extends Claim {
  nodeType: "claim" | "root";
}

export interface EvidenceEdge {
  from: string;
  to: string;
  relation: "supports" | "derived-from" | "conflicts-with";
}

export interface EvidenceGraph {
  root: string;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}

export interface MonitorabilityScore {
  identity: number;
  appointment: number;
  doctor: number;
  decision: number;
  availability: number;
  completion: number;
  evidence: number;
  overall: number;
  action: "normal reconciliation" | "additional verification" | "recover / human review";
}

export interface TrajectoryEvent {
  type: "observation" | "retrieval" | "model_output" | "tool_selection" | "state_update" | "retry" | "escalation" | "side_effect";
  detail: string;
  safe: boolean;
}

export interface ConversationContract {
  version: 1;
  identity: { subject: string };
  objective: { confirmAppointment: true };
  allowedActions: readonly ["confirm", "reschedule", "cancel"];
  forbiddenActions: readonly ["invent_availability", "invent_medical_information", "disclose_before_identity", "modify_unprepared_slot"];
  requiredEvidence: readonly ["patient_identity", "appointment_decision", "doctor", "conversation_completion"];
  conditionalEvidence: {
    firstVisitYes: readonly ["identity_document_reminder", "arrive_30_minutes_early", "registration", "information_form"];
    firstVisitNo: readonly [];
  };
  commitConditions: readonly ["patient_confirmed", "appointment_or_reschedule_verified", "provider_completed", "conversation_completed", "no_conflicts"];
  digest: string;
}

export interface PreparedState {
  slot: string;
  slotVersion: number;
  stateVersion: number;
  preparedAt: string;
}

export interface AuthoritativeReadback {
  slot: string;
  slotVersion: number;
  stateVersion: number;
  readbackAt: string;
}

export interface CompoundReasoningResult {
  agreement: number;
  disagreement: number;
  interpretations: Array<{ parser: string; claims: Claim[] }>;
  earlyExit: boolean;
  action: "confidence-signal" | "recover";
}

export interface AssuranceContext {
  claims: Claim[];
  claimLedger: ClaimLedger;
  evidenceGraph: EvidenceGraph;
  monitorability: MonitorabilityScore;
  bitemporalFacts: BitemporalFact[];
  retrievedMemory: MemoryItem[];
  thoughts: ThoughtNode[];
}

export interface BitemporalFact<T = string> {
  factId: string;
  value: T;
  validFrom: string;
  validTo?: string;
  recordedAt: string;
  supersededAt?: string;
  version: number;
  source: string;
}

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  text: string;
  tags: string[];
  recordedAt: string;
  validFrom: string;
  validTo?: string;
}

export interface ThoughtNode {
  id: string;
  hypothesis: string;
  dependsOn: string[];
  supports: string[];
  contradicts: string[];
  score: number;
}

function normalize(value: string): string[] {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(Boolean);
}

function overlap(a: string, b: string): number {
  const left = new Set(normalize(a));
  const right = new Set(normalize(b));
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(left.size, right.size);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function semanticRag(query: string, memory: MemoryItem[], limit = 5): MemoryItem[] {
  return memory.map((item) => ({ item, score: overlap(query, `${item.text} ${item.tags.join(" ")}`) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((entry) => entry.item);
}

export function createClaim(input: Omit<Claim, "id" | "recordedAt" | "authority" | "provenance"> & Partial<Pick<Claim, "authority" | "provenance">>): Claim {
  const recordedAt = new Date().toISOString();
  const authority = input.authority ?? (input.source === "authoritative" ? "authoritative" : input.source === "derived" ? "derived" : "conversational");
  const provenance = input.provenance ?? input.evidenceRefs;
  const id = `claim_${digest({ subject: input.subject, predicate: input.predicate, value: input.value, source: input.source, evidenceRefs: input.evidenceRefs }).slice(0, 16)}`;
  return { ...input, authority, provenance, id, recordedAt };
}

export function buildGoT(claims: Claim[]): ThoughtNode[] {
  const nodes: ThoughtNode[] = claims.map((claim) => ({ id: `thought_${claim.id}`, hypothesis: `${claim.subject}.${claim.predicate}=${claim.value}`, dependsOn: claim.evidenceRefs, supports: [], contradicts: [], score: claim.confidence }));
  for (const left of nodes) for (const right of nodes) {
    if (left.id === right.id) continue;
    if (left.hypothesis.split("=")[0] === right.hypothesis.split("=")[0] && left.hypothesis !== right.hypothesis) left.contradicts.push(right.id);
  }
  return nodes;
}

export function buildClaimLedger(claims: Claim[]): ClaimLedger {
  const conflicts = claims.filter((claim) => claim.status === "contradicted");
  const verified = claims.filter((claim) => claim.status === "verified" || (claim.status === "true" && claim.authority === "authoritative"));
  const required = ["patient.confirmed", "appointment.decision", "appointment.doctor", "conversation.completed"];
  const requiredSatisfied = required.every((predicate) => claims.some((claim) => claim.predicate === predicate && verified.includes(claim)));
  return { claims, verified, conflicts, commitAllowed: requiredSatisfied && conflicts.length === 0 };
}

export function buildEvidenceGraph(ledger: ClaimLedger): EvidenceGraph {
  const root = "call-transaction";
  const nodes: EvidenceNode[] = [{ id: root, nodeType: "root", subject: root, predicate: "transaction", value: "call", status: "unverified", source: "call-e", authority: "conversational", evidenceRefs: [], confidence: 1, validFrom: new Date().toISOString(), recordedAt: new Date().toISOString(), provenance: [] }, ...ledger.claims.map((claim) => ({ ...claim, nodeType: "claim" as const }))];
  const edges = ledger.claims.map((claim) => ({ from: root, to: claim.id, relation: claim.status === "contradicted" ? "conflicts-with" as const : claim.source === "derived" ? "derived-from" as const : "supports" as const }));
  return { root, nodes, edges };
}

function claimScore(claims: Claim[], predicates: string[]): number {
  const matches = claims.filter((claim) => predicates.includes(claim.predicate));
  if (!matches.length) return 0;
  if (matches.some((claim) => claim.status === "contradicted" || claim.status === "stale")) return 0;
  return Math.max(...matches.map((claim) => claim.status === "verified" || (claim.status === "true" && claim.authority === "authoritative") ? 1 : claim.status === "unknown" ? 0 : 0.5));
}

export function scoreMonitorability(ledger: ClaimLedger): MonitorabilityScore {
  const identity = claimScore(ledger.claims, ["patient.confirmed"]);
  const appointment = claimScore(ledger.claims, ["appointment.confirmed", "appointment.decision"]);
  const doctor = claimScore(ledger.claims, ["appointment.doctor"]);
  const decision = claimScore(ledger.claims, ["appointment.decision"]);
  const availability = claimScore(ledger.claims, ["appointment.slot", "appointment.time"]);
  const completion = claimScore(ledger.claims, ["conversation.completed"]);
  const evidence = ledger.claims.length ? ledger.claims.filter((claim) => claim.evidenceRefs.length > 0).length / ledger.claims.length : 0;
  const values = [identity, appointment, doctor, decision, availability, completion, clamp01(evidence)];
  const overall = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  const action = overall >= 0.9 ? "normal reconciliation" : overall >= 0.7 ? "additional verification" : "recover / human review";
  return { identity, appointment, doctor, decision, availability, completion, evidence: Number(evidence.toFixed(2)), overall, action };
}

export function evaluateTrajectory(events: TrajectoryEvent[]): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  let sideEffects = 0;
  let identityRejected = false;
  for (const event of events) {
    if (!event.safe) violations.push(`${event.type}:${event.detail}`);
    if (event.type === "side_effect") sideEffects += 1;
    if (event.detail.toLowerCase().includes("identity rejected") || event.detail.toLowerCase().includes("wrong identity")) identityRejected = true;
    if (identityRejected && (event.detail.toLowerCase().includes("appointment disclosed") || event.detail.toLowerCase().includes("doctor disclosed"))) violations.push("disclosure-after-identity-failure");
    if (event.type === "retry" && sideEffects > 0) violations.push("retry-after-side-effect");
  }
  if (sideEffects > 1) violations.push("multiple-side-effects");
  return { safe: violations.length === 0, violations };
}

export function compoundReasoning(parsers: Array<{ name: string; claims: Claim[] }>): CompoundReasoningResult {
  if (parsers.length === 0) return { agreement: 0, disagreement: 0, interpretations: [], earlyExit: false, action: "recover" };
  const byPredicate = new Map<string, string[]>();
  for (const parser of parsers) for (const claim of parser.claims) byPredicate.set(claim.predicate, [...(byPredicate.get(claim.predicate) ?? []), claim.value]);
  let agreements = 0;
  let disagreements = 0;
  for (const values of byPredicate.values()) values.length > 0 && new Set(values).size === 1 ? agreements += 1 : disagreements += 1;
  const total = agreements + disagreements;
  const agreement = total ? agreements / total : 0;
  const disagreement = total ? disagreements / total : 0;
  return { agreement, disagreement, interpretations: parsers.map((parser) => ({ parser: parser.name, claims: parser.claims })), earlyExit: agreement === 1, action: disagreement === 0 ? "confidence-signal" : "recover" };
}

export function reconcileStaleState(prepared: PreparedState, readback: AuthoritativeReadback): { status: "current" | "stale"; action: "commit" | "recover" } {
  const current = prepared.slot === readback.slot && prepared.slotVersion === readback.slotVersion && prepared.stateVersion === readback.stateVersion;
  return current ? { status: "current", action: "commit" } : { status: "stale", action: "recover" };
}

export function conserveExternalSideEffect(existingCallId: string | undefined, requestedNewExecution: boolean): { allowed: boolean; action: "reconcile_existing" | "execute_once" | "reject_duplicate" } {
  if (existingCallId) return { allowed: false, action: "reconcile_existing" };
  if (!requestedNewExecution) return { allowed: false, action: "reject_duplicate" };
  return { allowed: true, action: "execute_once" };
}

export function buildConversationContract(patientName: string): ConversationContract {
  const body = {
    identity: { subject: patientName },
    objective: { confirmAppointment: true as const },
    allowedActions: ["confirm", "reschedule", "cancel"] as const,
    forbiddenActions: ["invent_availability", "invent_medical_information", "disclose_before_identity", "modify_unprepared_slot"] as const,
    requiredEvidence: ["patient_identity", "appointment_decision", "doctor", "conversation_completion"] as const,
    conditionalEvidence: { firstVisitYes: ["identity_document_reminder", "arrive_30_minutes_early", "registration", "information_form"] as const, firstVisitNo: [] as const },
    commitConditions: ["patient_confirmed", "appointment_or_reschedule_verified", "provider_completed", "conversation_completed", "no_conflicts"] as const,
  };
  return { version: 1, ...body, digest: digest(body) };
}

export function classifyClaim(_value: string, evidenceRefs: string[], verified: boolean, fresh: boolean, contradicted: boolean): EpistemicStatus {
  if (contradicted) return "contradicted";
  if (!fresh) return "stale";
  if (verified) return "verified";
  if (!evidenceRefs.length) return "unknown";
  return "unverified";
}

export interface FormalGateResult { allowed: boolean; violations: string[]; }
export function formalGate(input: {
  decision: "commit" | "abort" | "recover";
  patientConfirmed?: string | undefined;
  appointmentDecision?: string | undefined;
  providerStatus?: string | undefined;
  taskCompleted?: boolean | undefined;
  conversationCompleted?: boolean | undefined;
  evidenceItems?: string[] | undefined;
  selectedSlotPrepared?: boolean | undefined;
  contradiction?: boolean | undefined;
}): FormalGateResult {
  const violations: string[] = [];
  if (input.decision === "commit") {
    if (input.patientConfirmed !== "yes") violations.push("INVARIANT_IDENTITY_VERIFIED");
    if (input.providerStatus !== "completed") violations.push("INVARIANT_PROVIDER_TERMINAL");
    if (input.taskCompleted !== true) violations.push("INVARIANT_TASK_COMPLETED");
    if (input.conversationCompleted !== true) violations.push("INVARIANT_CONVERSATION_COMPLETED");
    if (!input.evidenceItems?.length) violations.push("INVARIANT_EVIDENCE_PRESENT");
    if (input.appointmentDecision === "reschedule" && input.selectedSlotPrepared !== true) violations.push("INVARIANT_SLOT_PREPARED");
    if (input.contradiction === true) violations.push("INVARIANT_NO_CONTRADICTION");
  }
  return { allowed: violations.length === 0, violations };
}

export function buildAssuranceContext(input: {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentDecision?: string | undefined;
  patientConfirmed?: string | undefined;
  evidenceSummary: string;
  evidenceItems?: string[] | undefined;
  firstVisit?: string | undefined;
}): AssuranceContext {
  const now = new Date().toISOString();
  const memory: MemoryItem[] = [
    { id: "mem_first_visit", kind: "procedural", text: "First visit requires identity document, arrival 30 minutes early, registration and information form.", tags: ["first visit", "identity", "registration", "form"], recordedAt: now, validFrom: now },
    { id: "mem_reception", kind: "semantic", text: "Receptionist confirms the appointment naturally and asks whether anything else is needed.", tags: ["appointment", "reception", "confirmation"], recordedAt: now, validFrom: now },
  ];
  const claims: Claim[] = [
    createClaim({ subject: input.patientName, predicate: "appointment.doctor", value: input.doctorName, status: "unverified", source: "call-e", authority: "conversational", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now, provenance: ["call-e", "structured_result"] }),
    createClaim({ subject: input.patientName, predicate: "appointment.date", value: input.appointmentDate, status: "unverified", source: "call-e", authority: "conversational", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now, provenance: ["call-e", "structured_result"] }),
    createClaim({ subject: input.patientName, predicate: "appointment.time", value: input.appointmentTime, status: "unverified", source: "call-e", authority: "conversational", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now, provenance: ["call-e", "structured_result"] }),
    createClaim({ subject: input.patientName, predicate: "patient.confirmed", value: input.patientConfirmed ?? "unknown", status: input.patientConfirmed === "yes" ? "true" : "unknown", source: "call-e", authority: "conversational", evidenceRefs: [input.evidenceSummary], confidence: 0.9, validFrom: now, provenance: ["call-e", "structured_result"] }),
    createClaim({ subject: input.patientName, predicate: "appointment.decision", value: input.appointmentDecision ?? "unknown", status: "unverified", source: "call-e", authority: "conversational", evidenceRefs: input.evidenceItems ?? [input.evidenceSummary], confidence: 0.9, validFrom: now, provenance: ["call-e", "structured_result"] }),
    createClaim({ subject: input.patientName, predicate: "conversation.completed", value: "unknown", status: "unknown", source: "call-e", authority: "conversational", evidenceRefs: [], confidence: 0, validFrom: now, provenance: [] }),
  ];
  const claimLedger = buildClaimLedger(claims);
  const evidenceGraph = buildEvidenceGraph(claimLedger);
  const monitorability = scoreMonitorability(claimLedger);
  const bitemporalFacts: BitemporalFact[] = claims.map((claim, index) => ({ factId: claim.id, value: claim.value, validFrom: claim.validFrom, recordedAt: claim.recordedAt, version: index + 1, source: claim.source }));
  const retrievalQuery = [input.appointmentDecision ?? "confirm", input.firstVisit === "yes" ? "first visit" : input.firstVisit === "no" ? "repeat visit" : "unknown visit", "appointment"].join(" ");
  const retrievedMemory = semanticRag(retrievalQuery, memory);
  return { claims, claimLedger, evidenceGraph, monitorability, bitemporalFacts, retrievedMemory, thoughts: buildGoT(claims) };
}
