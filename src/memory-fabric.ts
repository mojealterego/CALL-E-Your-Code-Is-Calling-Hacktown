import { semanticRag, type MemoryItem } from "./assurance.js";

/**
 * Provenance carried by every retrieved memory item. Retrieval is contextual
 * evidence only and is never an authorization source.
 */
export interface MemoryProvenance {
  memoryId: string;
  content: string;
  memoryType: MemoryItem["kind"];
  source: string;
  createdAt: string;
  validFrom: string;
  validTo?: string;
  retrievedAt: string;
  confidence: number;
  authority: "policy" | "human" | "authoritative" | "conversational" | "derived";
  verified: boolean;
}

/** The associative graph is a memory dimension, not an execution authority. */
export interface MemoryGraphEdge {
  from: string;
  to: string;
  relation: "supports" | "derived-from" | "conflicts-with" | "related-to";
}

export interface BitemporalMemoryItem extends MemoryItem {
  /** Version of the fact in the domain state. */
  version: number;
  /** Version at which this record was superseded, if any. */
  supersededAt?: string;
  source: string;
  confidence: number;
  authority: MemoryProvenance["authority"];
  verified: boolean;
}

/**
 * Seven-dimensional memory:
 * working, episodic, semantic, procedural, holographic, bitemporal and graph.
 * The first five are content collections; bitemporal and graph are orthogonal
 * indexes over that content. Semantic RAG is an access mechanism, not memory.
 */
export interface MemoryFabric {
  working: MemoryItem[];
  episodic: MemoryItem[];
  semantic: MemoryItem[];
  procedural: MemoryItem[];
  holographic: MemoryItem[];
  bitemporal: BitemporalMemoryItem[];
  graph: MemoryGraphEdge[];
}

export function emptyMemoryFabric(): MemoryFabric {
  return { working: [], episodic: [], semantic: [], procedural: [], holographic: [], bitemporal: [], graph: [] };
}

export function semanticRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.semantic, limit);
}

export function episodicRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.episodic, limit);
}

export function proceduralRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.procedural, limit);
}

/** Retrieve facts valid at a domain time, while preserving transaction-time order. */
export function temporalRetrieve(at: string, fabric: MemoryFabric, limit = 20): BitemporalMemoryItem[] {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) throw new Error("Invalid temporal query");
  return fabric.bitemporal
    .filter((item) => Date.parse(item.validFrom) <= t && (!item.validTo || t < Date.parse(item.validTo)))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
    .slice(0, limit);
}

/**
 * Holographic retrieval is a deterministic associative reconstruction: tokens
 * from the query activate related tags/content, then linked memories are ranked.
 */
export function holographicRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.holographic, limit);
}

/** Graph traversal starts from memory IDs mentioned by the query's lexical hits. */
export function graphRetrieve(query: string, fabric: MemoryFabric, limit = 10): MemoryItem[] {
  const all = [
    ...fabric.working,
    ...fabric.episodic,
    ...fabric.semantic,
    ...fabric.procedural,
    ...fabric.holographic,
  ];
  const direct = semanticRag(query, all, limit);
  const directIds = new Set(direct.map((item) => item.id));
  const linkedIds = new Set<string>();
  for (const edge of fabric.graph) {
    if (directIds.has(edge.from)) linkedIds.add(edge.to);
    if (directIds.has(edge.to)) linkedIds.add(edge.from);
  }
  const linked = all.filter((item) => linkedIds.has(item.id));
  return [...direct, ...linked.filter((item) => !directIds.has(item.id))].slice(0, limit);
}

/** Whole-memory retrieval used by GoT/R3 context assembly. */
export function retrieveWholeMemory(query: string, fabric: MemoryFabric, limitPerDimension = 5): MemoryItem[] {
  const ranked = [
    ...semanticRetrieve(query, fabric, limitPerDimension),
    ...episodicRetrieve(query, fabric, limitPerDimension),
    ...proceduralRetrieve(query, fabric, limitPerDimension),
    ...holographicRetrieve(query, fabric, limitPerDimension),
    ...graphRetrieve(query, fabric, limitPerDimension),
  ];
  const seen = new Set<string>();
  return ranked.filter((item) => !seen.has(item.id) && seen.add(item.id));
}

export function provenanceForMemory(
  item: MemoryItem,
  input: Omit<MemoryProvenance, "memoryId" | "content" | "memoryType" | "createdAt" | "validFrom" | "validTo">,
): MemoryProvenance {
  return {
    memoryId: item.id,
    content: item.text,
    memoryType: item.kind,
    createdAt: item.recordedAt,
    validFrom: item.validFrom,
    ...(item.validTo ? { validTo: item.validTo } : {}),
    ...input,
  };
}

export function provenanceForBitemporalMemory(
  item: BitemporalMemoryItem,
  retrievedAt: string,
): MemoryProvenance {
  return {
    memoryId: item.id,
    content: item.text,
    memoryType: item.kind,
    source: item.source,
    createdAt: item.recordedAt,
    validFrom: item.validFrom,
    ...(item.validTo ? { validTo: item.validTo } : {}),
    retrievedAt,
    confidence: item.confidence,
    authority: item.authority,
    verified: item.verified,
  };
}

/** Retrieval and memory provenance can never authorize consequential execution. */
export function memoryCanAuthorizeExecution(_memory: MemoryProvenance): false {
  return false;
}
