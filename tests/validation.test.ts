import { describe, expect, it } from "vitest";
import { validateOutcome } from "../src/validation.js";

describe("outcome validation", () => {
  it("accepts a fully specified outcome", () => {
    expect(validateOutcome({
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed the diversion and ETA 16:40.",
      confidence: "high",
    }).confidence).toBe("high");
  });

  it("rejects missing evidence", () => {
    expect(() => validateOutcome({
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "",
      confidence: "high",
    })).toThrow();
  });

  it("rejects unknown enum values", () => {
    expect(() => validateOutcome({
      route_acceptance: "maybe",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed.",
      confidence: "high",
    })).toThrow();
  });

  it("rejects unexpected fields", () => {
    expect(() => validateOutcome({
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed.",
      confidence: "high",
      hidden_override: true,
    })).toThrow(/Unexpected outcome field/);
  });
});
