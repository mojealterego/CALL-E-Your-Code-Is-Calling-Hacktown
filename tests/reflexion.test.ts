import { describe, expect, it } from "vitest";
import { BitemporalMemoryStore } from "../src/bitemporal-memory.js";
import { reflectOnExecution, storeReflexionFinding, type ReflexionFinding } from "../src/reflexion.js";
import type { Incident, CallOutcome } from "../src/domain.js";

const incident: Incident = {
  id: "INC-REFLECT-1",
  vehicleId: "TRUCK-7",
  phone: "+48123456789",
  closure: "Route exception requiring ETA coordination.",
  requestedBy: "dispatcher",
  goal: "coordinate route and ETA",
};

const outcome: CallOutcome = {
  route_acceptance: "yes",
  eta_update_time: "16:40",
  escalation_needed: "none",
  evidence_summary: "Driver confirmed the revised ETA.",
  confidence: "high",
};

describe("reflexion", () => {
  it("turns an uncertain outcome into an escalation correction", () => {
    const finding = reflectOnExecution(incident, "incident:INC-REFLECT-1:call:TRUCK-7", {
      state: "escalated",
      outcome: { ...outcome, confidence: "low" },
      policyPassed: true,
    });
    expect(finding.kind).toBe("uncertain_outcome");
    expect(finding.safeToAutoResolve).toBe(false);
  });

  it("stores retrospective findings in episodic bitemporal memory", () => {
    const store = new BitemporalMemoryStore<ReflexionFinding>();
    const finding = reflectOnExecution(incident, "op-reflect", {
      state: "resolved",
      outcome,
      policyPassed: true,
    });
    const record = storeReflexionFinding(store, finding, "2026-09-14T01:00:00.000Z");
    expect(record.kind).toBe("episodic");
    expect(store.asOf("2026-09-14T01:00:00.000Z", "2026-09-14T01:00:01.000Z")).toHaveLength(1);
  });
});
