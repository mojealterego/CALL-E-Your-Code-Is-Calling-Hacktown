import { describe, expect, it } from "vitest";
import { prepareTransaction, reconcileTransaction } from "../src/transaction.js";

describe("voice transaction reconciliation", () => {
  const tx = prepareTransaction({
    transactionId: "TX-0042",
    incidentId: "AF-0001",
    participantId: "driver-42",
    route: "B",
    maxEtaMinutes: 1140,
  });

  it("commits matching high-confidence evidence", () => {
    expect(reconcileTransaction(tx, {
      route: "B",
      etaMinutes: 1100,
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route B and confirmed ETA.",
    }).decision).toBe("commit");
  });

  it("aborts when the participant proposes a conflicting route", () => {
    const result = reconcileTransaction(tx, {
      route: "C",
      etaMinutes: 1100,
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route C.",
    });
    expect(result.decision).toBe("abort");
    expect(result.reasons).toContain("observed route does not match prepared route");
  });

  it("recovers instead of committing incomplete evidence", () => {
    const result = reconcileTransaction(tx, {
      acceptance: "unknown",
      confidence: "unknown",
      evidenceSummary: "Call state could not establish the route.",
    });
    expect(result.decision).toBe("recover");
  });
});
