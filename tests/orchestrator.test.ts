import { describe, expect, it } from "vitest";
import { AuditLedger } from "../src/ledger.js";
import { runIncident } from "../src/orchestrator.js";

const incident = {
  id: "I-42",
  vehicleId: "TRUCK-42",
  phone: "+48123456789",
  closure: "A4 closure",
  requestedBy: "dispatch",
  proposedRoute: "B",
  maxEta: "19:00",
  goal: "Inform the driver about the route closure, verify acceptance of Route B, and confirm the revised ETA.",
};

describe("orchestrator", () => {
  it("completes the safe dry-run path through commit", async () => {
    const result = await runIncident(incident, { live: false, ledger: new AuditLedger() });
    expect(result.record.state).toBe("resolved");
    expect(result.record.transactionDecision).toBe("commit");
    expect(result.outcome?.route_acceptance).toBe("yes");
    expect(result.capability?.capabilityId).toMatch(/^cap_[a-f0-9]{24}$/);
    expect(result.capability?.endpointDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.record.transactionReceipt?.decision).toBe("commit");
    expect(result.record.transactionReceipt?.decisionDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reuses a terminal result when the same incident is submitted again", async () => {
    const ledger = new AuditLedger();
    const first = await runIncident(incident, { live: false, ledger });
    const second = await runIncident(incident, { live: false, ledger });
    expect(first.record.auditDigest).toBeTruthy();
    expect(second.reused).toBe(true);
    expect(ledger.snapshot()).toHaveLength(1);
  });
});
