import { describe, expect, it } from "vitest";
import { AuditLedger } from "../src/ledger.js";

describe("audit ledger", () => {
  it("reuses an existing operation key instead of creating a second call identity", () => {
    const ledger = new AuditLedger();
    const a = ledger.reserve("incident:I-1:call:TRUCK-42");
    const b = ledger.reserve("incident:I-1:call:TRUCK-42");
    expect(b.createdAt).toBe(a.createdAt);
    expect(ledger.snapshot()).toHaveLength(1);
  });

  it("produces an audit digest on every transition", () => {
    const ledger = new AuditLedger();
    ledger.reserve("op-1");
    const record = ledger.transition("op-1", "validated");
    expect(record.auditDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects invalid state transitions", () => {
    const ledger = new AuditLedger();
    ledger.reserve("op-1");
    expect(() => ledger.transition("op-1", "resolved")).toThrow(/Invalid incident transition/);
  });

  it("keeps an append-only hash-linked transition history", () => {
    const ledger = new AuditLedger();
    ledger.reserve("op-1");
    const validated = ledger.transition("op-1", "validated");
    const prepared = ledger.transition("op-1", "prepared");
    const history = ledger.history();
    expect(history).toHaveLength(3);
    expect(prepared.previousAuditDigest).toBe(validated.auditDigest);
    expect(history[2]!.previousAuditDigest).toBe(history[1]!.auditDigest);
    expect(history.map((entry) => entry.state)).toEqual(["detected", "validated", "prepared"]);
  });
});
