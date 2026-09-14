import { describe, expect, it } from "vitest";
import { runSyntheticRedTeam, syntheticRedTeamCases } from "../src/red-team.js";

describe("synthetic red team", () => {
  it("ships deterministic adversarial cases", () => {
    const cases = syntheticRedTeamCases();
    expect(cases.map((testCase) => testCase.id)).toEqual([
      "policy_rejection",
      "missing_evidence",
      "low_confidence",
      "malformed_outcome",
      "duplicate_operation",
      "budget_breach",
      "contradictory_outcome",
      "replayed_event",
    ]);
  });

  it("requires escalation for every adversarial case", () => {
    const results = runSyntheticRedTeam();
    expect(results).toHaveLength(8);
    expect(results.every((result) => result.passed && result.observedEscalation)).toBe(true);
  });
});
