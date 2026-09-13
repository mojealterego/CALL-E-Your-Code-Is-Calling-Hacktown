import { describe, expect, it } from "vitest";
import { createTransactionReceipt, sha256 } from "../src/receipt.js";

describe("transaction receipts", () => {
  const transaction = {
    transactionId: "TX-1",
    constraints: { route: "B", maxEta: "19:00" },
  };
  const evidence = {
    providerStatus: "completed",
    route: "B",
    eta: "18:40",
    acceptance: "yes",
    confidence: "high",
    evidenceItems: ["Driver accepted B.", "Driver stated 18:40."],
  };

  it("creates deterministic digests independent of object key order", () => {
    expect(sha256({ a: 1, b: 2 })).toBe(sha256({ b: 2, a: 1 }));
  });

  it("binds the decision to both prepared transaction and observed evidence", () => {
    const receipt = createTransactionReceipt({
      transactionId: "TX-1",
      transaction,
      evidence,
      decision: "commit",
      issuedAt: "2026-09-13T00:00:00.000Z",
    });
    expect(receipt.version).toBe("1");
    expect(receipt.receiptId).toMatch(/^rct_[a-f0-9]{24}$/);
    expect(receipt.transactionDigest).toHaveLength(64);
    expect(receipt.evidenceDigest).toHaveLength(64);
    expect(receipt.decisionDigest).toHaveLength(64);
  });

  it("changes the decision binding when the decision changes", () => {
    const commit = createTransactionReceipt({ transactionId: "TX-1", transaction, evidence, decision: "commit", issuedAt: "2026-09-13T00:00:00.000Z" });
    const abort = createTransactionReceipt({ transactionId: "TX-1", transaction, evidence, decision: "abort", issuedAt: "2026-09-13T00:00:00.000Z" });
    expect(commit.decisionDigest).not.toBe(abort.decisionDigest);
    expect(commit.receiptId).not.toBe(abort.receiptId);
  });
});
