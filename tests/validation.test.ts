import { describe, expect, it } from "vitest";
import { validateOutcome } from "../src/validation.js";

describe("outcome validation", () => {
  it("accepts a fully specified outcome", () => {
    expect(validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed the diversion and ETA 16:40.",
      confidence: "high",
    }).confidence).toBe("high");
  });

  it("accepts current CALL-E completion confidence", () => {
    const outcome = validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed the diversion and ETA 16:40.",
      confidence: "high",
      task_completed: true,
      completion_confidence: { score: 0.92, label: "high" },
      evidence: ["Driver accepted Route B."],
    });
    expect(outcome.task_completed).toBe(true);
    expect(outcome.evidence).toEqual(["Driver accepted Route B."]);
  });

  it("rejects missing evidence", () => {
    expect(() => validateOutcome({
      route: "B",
      route_acceptance: "yes",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "",
      confidence: "high",
    })).toThrow();
  });

  it("rejects unknown enum values", () => {
    expect(() => validateOutcome({
      route: "B",
      route_acceptance: "maybe",
      eta_update_time: "16:40",
      escalation_needed: "none",
      evidence_summary: "Driver confirmed.",
      confidence: "high",
    })).toThrow();
  });
});
