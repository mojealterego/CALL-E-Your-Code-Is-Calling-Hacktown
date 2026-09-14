export type MemoryKind = "working" | "episodic" | "procedural";

export interface BitemporalMemory<T> {
  id: string;
  kind: MemoryKind;
  value: T;
  validFrom: string;
  validTo?: string;
  recordedAt: string;
  supersedes?: string;
}

/**
 * Small deterministic bitemporal store for the prototype.
 * validFrom/validTo describe when a fact was true in the incident world;
 * recordedAt describes when AegisFleet learned it.
 */
export class BitemporalMemoryStore<T> {
  private readonly entries = new Map<string, BitemporalMemory<T>>();

  put(entry: BitemporalMemory<T>): void {
    if (this.entries.has(entry.id)) {
      throw new Error(`Memory entry already exists: ${entry.id}`);
    }
    const from = Date.parse(entry.validFrom);
    const recorded = Date.parse(entry.recordedAt);
    if (!Number.isFinite(from) || !Number.isFinite(recorded)) {
      throw new Error("validFrom and recordedAt must be ISO timestamps");
    }
    if (entry.validTo !== undefined) {
      const to = Date.parse(entry.validTo);
      if (!Number.isFinite(to) || to < from) {
        throw new Error("validTo must be an ISO timestamp after validFrom");
      }
    }
    this.entries.set(entry.id, entry);
  }

  /** Facts that were valid at a business-world point in time. */
  validAt(at: string): BitemporalMemory<T>[] {
    const point = Date.parse(at);
    if (!Number.isFinite(point)) throw new Error("at must be an ISO timestamp");
    return [...this.entries.values()]
      .filter((entry) => {
        const from = Date.parse(entry.validFrom);
        const to = entry.validTo ? Date.parse(entry.validTo) : Number.POSITIVE_INFINITY;
        return from <= point && point < to;
      })
      .sort((a, b) => Date.parse(a.validFrom) - Date.parse(b.validFrom));
  }

  /** Facts known to the system by a recording-time cutoff. */
  knownBy(recordedAt: string): BitemporalMemory<T>[] {
    const cutoff = Date.parse(recordedAt);
    if (!Number.isFinite(cutoff)) throw new Error("recordedAt must be an ISO timestamp");
    return [...this.entries.values()]
      .filter((entry) => Date.parse(entry.recordedAt) <= cutoff)
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  }

  /** Point-in-time reconstruction: facts true at validAt and already known by recordedAt. */
  asOf(validAt: string, recordedAt: string): BitemporalMemory<T>[] {
    const knownIds = new Set(this.knownBy(recordedAt).map((entry) => entry.id));
    return this.validAt(validAt).filter((entry) => knownIds.has(entry.id));
  }

  get size(): number {
    return this.entries.size;
  }
}
