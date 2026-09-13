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
    const record = this.keys.get(operationKey);
    if (!record) throw new Error(`Unknown operation key: ${operationKey}`);
    assertTransition(record.state, state);
    record.state = state;
    record.updatedAt = new Date().toISOString();
    Object.assign(record, patch);
    this.commit(record);
    return { ...record };
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
    const event: CallRecord = {
      ...record,
      previousAuditDigest: this.historyRecords.length > 0
        ? this.historyRecords[this.historyRecords.length - 1].auditDigest
        : undefined,
    };
    event.auditDigest = this.digest(event);
    this.historyRecords.push(Object.freeze({ ...event }));
    if (!this.keys.has(record.operationKey)) this.records.push(record);
    record.previousAuditDigest = event.previousAuditDigest;
    record.auditDigest = event.auditDigest;
    this.keys.set(record.operationKey, record);
  }

  private digest(record: CallRecord): string {
    return createHash("sha256")
      .update(JSON.stringify({ ...record, auditDigest: undefined }))
      .digest("hex");
  }
}
