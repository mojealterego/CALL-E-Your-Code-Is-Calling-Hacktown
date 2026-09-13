export type EpistemicStatus = "true" | "false" | "unknown" | "unverified" | "contradicted" | "stale" | "verified";
export type MemoryKind = "working" | "episodic" | "semantic" | "procedural" | "holographic";

export interface Claim {
  id: string;
  subject: string;
  predicate: string;
  value: string;
  status: EpistemicStatus;
  source: "call-e" | "memory" | "policy" | "authoritative";
  evidenceRefs: string[];
  confidence: number;
  validFrom: string;
  validTo?: string;
  recordedAt: string;
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

export interface AssuranceContext {
  claims: Claim[];
  bitemporalFacts: BitemporalFact[];
  retrievedMemory: MemoryItem[];
  thoughts: ThoughtNode[];
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

export function semanticRag(query: string, memory: MemoryItem[], limit = 5): MemoryItem[] {
  return memory
    .map((item) => ({ item, score: overlap(query, `${item.text} ${item.tags.join(" ")}`) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function createClaim(input: Omit<Claim, "id" | "recordedAt">): Claim {
  return { ...input, id: `claim_${Math.random().toString(36).slice(2, 10)}`, recordedAt: new Date().toISOString() };
}

export function buildGoT(claims: Claim[]): ThoughtNode[] {
  const nodes: ThoughtNode[] = claims.map((claim) => ({
    id: `thought_${claim.id}`,
    hypothesis: `${claim.subject}.${claim.predicate}=${claim.value}`,
    dependsOn: claim.evidenceRefs,
    supports: [],
    contradicts: [],
    score: claim.confidence,
  }));

  for (const left of nodes) {
    for (const right of nodes) {
      if (left.id === right.id) continue;
      if (left.hypothesis.split("=")[0] === right.hypothesis.split("=")[0] && left.hypothesis !== right.hypothesis) {
        left.contradicts.push(right.id);
      }
    }
  }
  return nodes;
}

export interface FormalGateResult {
  allowed: boolean;
  violations: string[];
}

/** Deterministic invariant gate. It is intentionally independent of model confidence. */
export function formalGate(input: {
  decision: "commit" | "abort" | "recover";
  patientConfirmed?: string;
  appointmentDecision?: string;
  providerStatus?: string;
  taskCompleted?: boolean;
  conversationCompleted?: boolean;
  evidenceItems?: string[];
  selectedSlotPrepared?: boolean;
  contradiction?: boolean;
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
  appointmentDecision?: string;
  patientConfirmed?: string;
  evidenceSummary: string;
  evidenceItems?: string[];
  firstVisit?: string;
}): AssuranceContext {
  const now = new Date().toISOString();
  const memory: MemoryItem[] = [
    { id: "mem_first_visit", kind: "procedural", text: "First visit requires identity document, arrival 30 minutes early, registration and information form.", tags: ["first visit", "identity", "registration", "form"], recordedAt: now, validFrom: now },
    { id: "mem_reception", kind: "semantic", text: "Receptionist confirms the appointment naturally and asks whether anything else is needed.", tags: ["appointment", "reception", "confirmation"], recordedAt: now, validFrom: now },
  ];
  const claims: Claim[] = [
    createClaim({ subject: input.patientName, predicate: "appointment.doctor", value: input.doctorName, status: "unverified", source: "call-e", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now }),
    createClaim({ subject: input.patientName, predicate: "appointment.date", value: input.appointmentDate, status: "unverified", source: "call-e", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now }),
    createClaim({ subject: input.patientName, predicate: "appointment.time", value: input.appointmentTime, status: "unverified", source: "call-e", evidenceRefs: ["call-e"], confidence: 0.9, validFrom: now }),
    createClaim({ subject: input.patientName, predicate: "patient.confirmed", value: input.patientConfirmed ?? "unknown", status: input.patientConfirmed === "yes" ? "true" : "unknown", source: "call-e", evidenceRefs: [input.evidenceSummary], confidence: 0.9, validFrom: now }),
  ];
  const bitemporalFacts: BitemporalFact[] = claims.map((claim, index) => ({ factId: claim.id, value: claim.value, validFrom: claim.validFrom, recordedAt: claim.recordedAt, version: index + 1, source: claim.source }));
  const retrievalQuery = [input.appointmentDecision ?? "confirm", input.firstVisit === "yes" ? "first visit" : input.firstVisit === "no" ? "repeat visit" : "unknown visit", "appointment"].join(" ");
  const retrievedMemory = semanticRag(retrievalQuery, memory);
  return { claims, bitemporalFacts, retrievedMemory, thoughts: buildGoT(claims) };
}
