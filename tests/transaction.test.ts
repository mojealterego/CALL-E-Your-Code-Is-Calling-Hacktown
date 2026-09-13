import { describe, expect, it } from "vitest";
import { prepareTransaction, reconcileTransaction } from "../src/transaction.js";

describe("voice transaction reconciliation", () => {
  const tx = prepareTransaction({
    transactionId: "TX-0042",
    incidentId: "AF-0001",
    participantId: "driver-42",
    route: "B",
    maxEta: "19:00",
  });

  it("commits matching high-confidence evidence from a completed call", () => {
    expect(reconcileTransaction(tx, {
      route: "B",
      eta: "18:40",
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route B and confirmed ETA.",
      evidenceItems: ["Driver accepted Route B.", "Driver stated revised ETA 18:40."],
      taskCompleted: true,
      providerStatus: "completed",
    }).decision).toBe("commit");
  });

  it("aborts when the participant proposes a conflicting route", () => {
    const result = reconcileTransaction(tx, {
      route: "C",
      eta: "18:40",
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route C.",
      evidenceItems: ["Driver accepted Route C."],
      taskCompleted: true,
      providerStatus: "completed",
    });
    expect(result.decision).toBe("abort");
    expect(result.reasons).toContain("observed route does not match prepared route");
  });

  it("recovers instead of committing incomplete evidence", () => {
    const result = reconcileTransaction(tx, {
      acceptance: "unknown",
      confidence: "unknown",
      evidenceSummary: "Call state could not establish the route.",
      taskCompleted: false,
      providerStatus: "completed",
    });
    expect(result.decision).toBe("recover");
  });

  it("recovers when the call matches but provider evidence is absent", () => {
    const result = reconcileTransaction(tx, {
      route: "B",
      eta: "18:40",
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route B and confirmed ETA.",
      taskCompleted: true,
      providerStatus: "completed",
    });
    expect(result.decision).toBe("recover");
    expect(result.reasons).toContain("CALL-E terminal evidence is missing");
  });

  it("recovers a failed CALL-E task even when the conversation appears to match", () => {
    const result = reconcileTransaction(tx, {
      route: "B",
      eta: "18:40",
      acceptance: "yes",
      confidence: "high",
      evidenceSummary: "Driver accepted Route B and confirmed ETA.",
      evidenceItems: ["Driver accepted Route B."],
      taskCompleted: true,
      providerStatus: "failed",
    });
    expect(result.decision).toBe("recover");
    expect(result.reasons).toContain("authoritative CALL-E status is not completed");
  });
});
