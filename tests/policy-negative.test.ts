import { describe, expect, it } from "vitest";
import { validateIncident, canResolve } from "../src/policy.js";

const base = {
  id: "I-NEG",
  vehicleId: "TRUCK-42",
  phone: "+48123456789",
  closure: "A4 closure",
  requestedBy: "dispatch",
  goal: "Inform driver about route closure, negotiate a route and confirm revised ETA.",
  proposedRoute: "A4 -> DK94",
  maxEta: "19:00",
};

describe("policy negative boundaries", () => {
  it("rejects missing incident context", () => {
    expect(validateIncident({ ...base, closure: "" }, false).allowed).toBe(false);
  });

  it("rejects a non-purpose-bounded goal", () => {
    expect(validateIncident({ ...base, goal: "Call the driver and chat." }, false).allowed).toBe(false);
  });

  it("never resolves on low confidence", () => {
    expect(canResolve({ route_acceptance: "yes", eta_update_time: "16:40", escalation_needed: "none", evidence_summary: "Driver confirmed.", confidence: "low" })).toBe(false);
  });

  it("never resolves when escalation is requested", () => {
    expect(canResolve({ route_acceptance: "yes", eta_update_time: "16:40", escalation_needed: "urgent", evidence_summary: "Driver reported a safety issue.", confidence: "high" })).toBe(false);
  });
});
