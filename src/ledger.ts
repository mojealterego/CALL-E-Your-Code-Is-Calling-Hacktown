import { createHash } from "node:crypto";
import type { CallOutcome, CallRecord, IncidentState } from "./domain.js";
import { assertTransition } from "./fsm.js";

export class AuditLedger {
  private readonly records: CallRecord[] = [];
  private readonly historyRecords: CallRecord[] = [];
  private readonly keys = new Map<string, CallRecord>();

  reserve(operationKey: string): CallRecord {
    const key = operationKey.trim();
    if (!key) throw new Error("operationKey is required");
    const existing = this.keys.get(key);
    if (existing) return { ...existing };
    const now = new Date().toISOString();
    const record: CallRecord = { operationKey: key, state: "detected", createdAt: now, updatedAt: now };
    this.commit(record);
    return { ...record };
  }

  transition(operationKey: string, state: IncidentState, patch: Partial<CallRecord> = {}): CallRecord {
    const current = this.keys.get(operationKey);
    if (!current) throw new Error(`Unknown operation key: ${operationKey}`);
    assertTransition(current.state, state);

    const next: CallRecord = {
      ...current,
      ...patch,
      state,
      updatedAt: new Date().toISOString(),
    };
    this.commit(next);
    return { ...next };
  }

  complete(operationKey: string, outcome: CallOutcome, callId?: string): CallRecord {
    const resolved = outcome.route_acceptance === "yes"
      && Boolean(outcome.eta_update_time.trim())
      && outcome.escalation_needed === "none"
      && Boolean(outcome.evidence_summary.trim())
      && outcome.confidence === "high";
    return this.transition(operationKey, resolved ? "resolved" : "escalated", {
      outcome,
      ...(callId ? { callId } : {}),
    });
  }

  has(operationKey: string): boolean {
    return this.keys.has(operationKey);
  }

  snapshot(): CallRecord[] {
    return this.records.map((record) => ({ ...record }));
  }

  history(): CallRecord[] {
    return this.historyRecords.map((record) => ({ ...record }));
  }

  private commit(record: CallRecord): void {
    const previous = this.historyRecords[this.historyRecords.length - 1];
    const eventBase: CallRecord = previous?.auditDigest
      ? { ...record, previousAuditDigest: previous.auditDigest }
      : { ...record };
    eventBase.auditDigest = this.digest(eventBase);
    const event = Object.freeze({ ...eventBase });
    this.historyRecords.push(event);

    const existingIndex = this.records.findIndex((item) => item.operationKey === record.operationKey);
    if (existingIndex >= 0) this.records[existingIndex] = { ...event };
    else this.records.push({ ...event });
    this.keys.set(record.operationKey, { ...event });
  }

  private digest(record: CallRecord): string {
    return createHash("sha256")
      .update(JSON.stringify({ ...record, auditDigest: undefined }))
      .digest("hex");
  }
}
