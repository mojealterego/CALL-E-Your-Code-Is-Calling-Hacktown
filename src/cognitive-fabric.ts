import { createHash } from "node:crypto";
import type { CallOutcome, Incident } from "./domain.js";
import { BitemporalMemoryStore, type BitemporalMemory } from "./bitemporal-memory.js";
import type { ClaimEvidence, EvidenceGraph } from "./assurance-fabric.js";

export type MemoryDimension = "working" | "episodic" | "semantic" | "procedural" | "holographic" | "bitemporal" | "graph";
export type ClaimKind = "memory" | "claim" | "evidence" | "fact" | "verified_fact" | "prediction" | "hypothesis";

export interface MemoryProvenance {
  memoryId: string;
  content: string;
  memoryType: MemoryDimension;
  source: string;
  createdAt: string;
  validFrom: string;
  validTo: string | null;
  retrievedAt: string;
  confidence: number;
  authority: "authoritative" | "policy" | "conversational" | "derived" | "human";
  verified: boolean;
}

export interface MemoryRecord {
  id: string;
  dimension: MemoryDimension;
  content: string;
  concepts: string[];
  source: string;
  confidence: number;
  validFrom: string;
  recordedAt: string;
  verified: boolean;
  provenance: MemoryProvenance;
}

export interface MemoryQueryResult { record: MemoryRecord; score: number; reasons: string[]; }

export interface KnowledgeRelation {
  from: string;
  to: string;
  relation: "supports" | "contradicts" | "requires" | "related" | "derived-from";
  weight: number;
}

export interface KnowledgeGraphSnapshot { nodes: MemoryRecord[]; edges: KnowledgeRelation[]; }

export interface ThoughtNode {
  id: string;
  hypothesis: string;
  kind: "observation" | "hypothesis" | "counterfactual" | "decision";
  support: string[];
  conflicts: string[];
  score: number;
}

export interface ThoughtGraph { root: string; nodes: ThoughtNode[]; edges: Array<{ from: string; to: string; relation: "supports" | "contradicts" | "requires" }>; selected?: string; }

export interface PredictedState { label: string; probability: number; assumptions: string[]; }
export interface JepaPrediction { currentState: string; predictions: PredictedState[]; observationRequired: boolean; }

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const tokenize = (text: string) => [...new Set(text.toLowerCase().split(/[^a-z0-9ąćęłńóśźż]+/i).filter((token) => token.length > 2))];
const overlap = (a: string[], b: string[]) => { const set = new Set(a); return b.filter((x) => set.has(x)).length; };

export class CognitiveMemoryFabric {
  private readonly records = new Map<string, MemoryRecord>();
  private readonly temporal = new BitemporalMemoryStore<MemoryRecord>();

  put(input: Omit<MemoryRecord, "provenance"> & { retrievedAt?: string }): MemoryRecord {
    if (this.records.has(input.id)) throw new Error(`Memory record already exists: ${input.id}`);
    const retrievedAt = input.retrievedAt ?? input.recordedAt;
    const provenance: MemoryProvenance = {
      memoryId: input.id, content: input.content, memoryType: input.dimension, source: input.source,
      createdAt: input.recordedAt, validFrom: input.validFrom, validTo: null, retrievedAt,
      confidence: input.confidence, authority: input.verified ? "authoritative" : "derived", verified: input.verified,
    };
    const record = { ...input, provenance };
    this.records.set(record.id, record);
    this.temporal.put({ id: record.id, kind: record.dimension === "semantic" ? "procedural" : record.dimension === "episodic" ? "episodic" : "working", value: record, validFrom: record.validFrom, recordedAt: record.recordedAt });
    return record;
  }

  get(id: string) { return this.records.get(id); }

  semanticRetrieve(query: string, limit = 5): MemoryQueryResult[] {
    const q = tokenize(query);
    return [...this.records.values()].map((record) => {
      const conceptHits = overlap(q, [...record.concepts, ...tokenize(record.content)]);
      const exact = record.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const score = Number((Math.min(1, (conceptHits / Math.max(1, q.length)) * 0.7 + exact * 0.3) * record.confidence).toFixed(4));
      return { record, score, reasons: conceptHits ? [`${conceptHits} concept overlap`] : exact ? ["exact phrase"] : [] };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  episodicRetrieve(entity: string, limit = 10): MemoryRecord[] {
    const needle = entity.toLowerCase();
    return [...this.records.values()].filter((r) => r.dimension === "episodic" && (r.content.toLowerCase().includes(needle) || r.concepts.some((c) => c.toLowerCase() === needle))).sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt)).slice(0, limit);
  }

  temporalRetrieve(at: string, limit = 10): MemoryRecord[] {
    return this.temporal.validAt(at).map((entry) => entry.value).slice(-limit).reverse();
  }

  graphRetrieve(rootId: string, graph: KnowledgeGraphSnapshot, depth = 2): MemoryRecord[] {
    const seen = new Set([rootId]); let frontier = [rootId];
    for (let i = 0; i < depth; i++) {
      const next: string[] = [];
      for (const edge of graph.edges) if (frontier.includes(edge.from) && !seen.has(edge.to)) { seen.add(edge.to); next.push(edge.to); }
      frontier = next;
    }
    return [...seen].map((id) => this.records.get(id)).filter((r): r is MemoryRecord => Boolean(r));
  }

  snapshot(): KnowledgeGraphSnapshot { return { nodes: [...this.records.values()], edges: [] }; }
}

export function buildKnowledgeGraph(records: MemoryRecord[], claimGraph?: EvidenceGraph): KnowledgeGraphSnapshot {
  const nodes = [...records];
  const edges: KnowledgeRelation[] = [];
  for (const a of nodes) for (const b of nodes) if (a.id !== b.id) {
    const shared = overlap(a.concepts, b.concepts);
    if (shared > 0) edges.push({ from: a.id, to: b.id, relation: "related", weight: shared / Math.max(a.concepts.length, b.concepts.length, 1) });
  }
  if (claimGraph) for (const edge of claimGraph.edges) edges.push({ from: edge.from, to: edge.to, relation: edge.relation === "conflicts-with" ? "contradicts" : edge.relation === "derived-from" ? "derived-from" : "supports", weight: 1 });
  return { nodes, edges };
}

export function buildThoughtGraph(hypotheses: Array<{ id: string; hypothesis: string; support: string[]; conflicts?: string[] }>): ThoughtGraph {
  const nodes: ThoughtNode[] = hypotheses.map((h) => ({ id: h.id, hypothesis: h.hypothesis, kind: "hypothesis", support: h.support, conflicts: h.conflicts ?? [], score: Number(((h.support.length - (h.conflicts?.length ?? 0)) / Math.max(1, h.support.length + (h.conflicts?.length ?? 0) + 1)).toFixed(4)) }));
  const edges: ThoughtGraph["edges"] = [];
  for (const a of nodes) for (const b of nodes) if (a.id !== b.id) {
    if (b.support.includes(a.id)) edges.push({ from: a.id, to: b.id, relation: "supports" });
    if (b.conflicts.includes(a.id)) edges.push({ from: a.id, to: b.id, relation: "contradicts" });
  }
  const selected = [...nodes].sort((a, b) => b.score - a.score)[0]?.id;
  return { root: selected ?? "empty", nodes, edges, selected };
}

export function reconcileThoughts(graph: ThoughtGraph): { selected?: ThoughtNode; action: "proceed" | "recover"; contradictions: number } {
  const contradictions = graph.edges.filter((e) => e.relation === "contradicts").length;
  const selected = graph.nodes.find((n) => n.id === graph.selected);
  return { selected, action: contradictions === 0 && selected && selected.score >= 0 ? "proceed" : "recover", contradictions };
}

export function predictNextState(incident: Incident, outcome: CallOutcome, availableSlots: string[] = []): JepaPrediction {
  const accepted = outcome.route_acceptance === "yes" && outcome.confidence === "high" && Boolean(outcome.evidence_summary.trim()) && outcome.escalation_needed === "none";
  const predictions: PredictedState[] = accepted
    ? [{ label: "appointment-confirmed", probability: 0.92, assumptions: ["authoritative readback agrees", "provider completion evidence present"] }, { label: "recover", probability: 0.08, assumptions: ["readback conflicts or becomes stale"] }]
    : availableSlots.length > 0
      ? [{ label: "recover-with-candidate-slot", probability: 0.7, assumptions: ["slot remains available", "identity and authorization remain valid"] }, { label: "human-review", probability: 0.3, assumptions: ["conversation remains ambiguous"] }]
      : [{ label: "human-review", probability: 0.9, assumptions: ["no verified executable alternative"] }, { label: "recover", probability: 0.1, assumptions: ["new authoritative evidence arrives"] }];
  return { currentState: `${incident.id}:${outcome.route_acceptance}:${outcome.escalation_needed}`, predictions, observationRequired: true };
}

export function claimFromMemory(record: MemoryRecord, claim: string): ClaimEvidence {
  return { claim, value: record.content, source: record.verified ? "authoritative-system" : "derived", evidence: [record.provenance.memoryId], confidence: record.confidence >= 0.8 ? "high" : record.confidence >= 0.5 ? "medium" : "low", authority: record.provenance.authority === "authoritative" ? "authoritative" : record.provenance.authority === "human" ? "conversational" : "derived", verified: record.verified, status: record.verified ? "TRUE" : "UNVERIFIED", timestamp: record.recordedAt, provenance: [record.provenance.source, record.provenance.memoryId] };
}

export function memoryReceipt(record: MemoryRecord): string { return sha(record.provenance); }
