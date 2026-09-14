import { describe, expect, it } from "vitest";
import { canResolve, validateIncident } from "../src/policy.js";

const incident = {
  id: "I-1",
  vehicleId: "TRUCK-42",
  phone: "+48123456789",
  closure: "A4 closure",
  requestedBy: "dispatch",
  goal: "Inform driver about route closure, negotiate route and confirm revised ETA.",
  proposedRoute: "A4 -> DK94",
  maxEta: "19:00",
} as const;

describe("policy", () => {
  it("accepts a valid operational incident", () => {
    expect(validateIncident(incident, false).allowed).toBe(true);
  });

  it("rejects malformed phone numbers", () => {
    expect(validateIncident({ ...incident, phone: "123" }, false).allowed).toBe(false);
  });

  it("rejects fixture numbers for live mode", () => {
    expect(validateIncident({ ...incident, phone: "+15550123456" }, true).allowed).toBe(false);
  });

  it("requires complete high-confidence evidence to resolve", () => {
    expect(canResolve({ route_acceptance: "yes", eta_update_time: "16:40", escalation_needed: "none", evidence_summary: "Driver confirmed.", confidence: "high" })).toBe(true);
    expect(canResolve({ route_acceptance: "unknown", eta_update_time: "16:40", escalation_needed: "none", evidence_summary: "Driver unclear.", confidence: "high" })).toBe(false);
  });
});
