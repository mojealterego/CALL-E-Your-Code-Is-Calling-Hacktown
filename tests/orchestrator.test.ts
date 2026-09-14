import { describe, expect, it } from "vitest";
import { AuditLedger } from "../src/ledger.js";
import { BitemporalMemoryStore } from "../src/bitemporal-memory.js";
import { runIncident } from "../src/orchestrator.js";
import type { ReflexionFinding } from "../src/reflexion.js";

const incident = {
  id: "I-42",
  vehicleId: "TRUCK-42",
  phone: "+48123456789",
  closure: "A4 closure",
  requestedBy: "dispatch",
  goal: "Inform the driver about the route closure, negotiate a diversion route, and confirm the revised ETA.",
};

describe("orchestrator", () => {
  it("completes the safe dry-run path and records a bitemporal reflexion finding", async () => {
    const ledger = new AuditLedger();
    const reflexionMemory = new BitemporalMemoryStore<ReflexionFinding>();
    const result = await runIncident(incident, { live: false, ledger, reflexionMemory });

    expect(result.record.state).toBe("resolved");
    expect(result.outcome?.route_acceptance).toBe("yes");
    expect(result.reflexion?.kind).toBe("safe_resolution");
    expect(result.reflexion?.safeToAutoResolve).toBe(false);
    expect(reflexionMemory.size).toBe(1);
    expect(reflexionMemory.validAt(new Date().toISOString())).toHaveLength(1);
  });

  it("records a policy-failure finding without permitting a retry", async () => {
    const ledger = new AuditLedger();
    const reflexionMemory = new BitemporalMemoryStore<ReflexionFinding>();
    const result = await runIncident({ ...incident, phone: "invalid" }, { live: false, ledger, reflexionMemory });

    expect(result.record.state).toBe("escalated");
    expect(result.reflexion?.kind).toBe("policy_failure");
    expect(result.reflexion?.safeToAutoResolve).toBe(false);
    expect(result.reflexion?.correction).toMatch(/escalat/i);
    expect(reflexionMemory.size).toBe(1);
  });

  it("does not create a second reflexion finding when a terminal operation is reused", async () => {
    const ledger = new AuditLedger();
    const reflexionMemory = new BitemporalMemoryStore<ReflexionFinding>();
    const first = await runIncident(incident, { live: false, ledger, reflexionMemory });
    const second = await runIncident(incident, { live: false, ledger, reflexionMemory });

    expect(first.record.auditDigest).toBeTruthy();
    expect(second.reused).toBe(true);
    expect(ledger.snapshot()).toHaveLength(1);
    expect(reflexionMemory.size).toBe(1);
  });
});
