import { semanticRag, type MemoryItem } from "./assurance.js";

export interface MemoryProvenance {
  memoryId: string;
  content: string;
  memoryType: "working" | "episodic" | "semantic" | "procedural" | "holographic";
  source: string;
  createdAt: string;
  validFrom: string;
  validTo?: string;
  retrievedAt: string;
  confidence: number;
  authority: "policy" | "human" | "authoritative" | "conversational" | "derived";
  verified: boolean;
}

export interface MemoryFabric {
  working: MemoryItem[];
  episodic: MemoryItem[];
  semantic: MemoryItem[];
  procedural: MemoryItem[];
  holographic: MemoryItem[];
}

export function semanticRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.semantic, limit);
}

export function episodicRetrieve(query: string, fabric: MemoryFabric, limit = 5): MemoryItem[] {
  return semanticRag(query, fabric.episodic, limit);
}

export function temporalRetrieve(at: string, fabric: MemoryFabric): MemoryItem[] {
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) throw new Error("Invalid temporal query");
  return [...fabric.working, ...fabric.episodic, ...fabric.semantic, ...fabric.procedural, ...fabric.holographic]
    .filter((item) => new Date(item.validFrom).getTime() <= t && (!item.validTo || t < new Date(item.validTo).getTime()))
    .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
}

export function graphRetrieve(query: string, fabric: MemoryFabric, limit = 10): MemoryItem[] {
  const all = [...fabric.working, ...fabric.episodic, ...fabric.semantic, ...fabric.procedural, ...fabric.holographic];
  return semanticRag(query, all, limit);
}

export function provenanceForMemory(item: MemoryItem, input: Omit<MemoryProvenance, "memoryId" | "content" | "memoryType" | "createdAt" | "validFrom" | "validTo">): MemoryProvenance {
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

/** Retrieval is contextual evidence only; it can never authorize execution. */
export function memoryCanAuthorizeExecution(_memory: MemoryProvenance): false { return false; }
