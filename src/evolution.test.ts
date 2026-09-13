import { describe, expect, it } from "vitest";
import { assuranceHomeostasis, buildSystemStateManifest, challengeDecision, compareShadowRuns, counterfactualCheck, createEvolutionCandidate, negotiatePreparedSlot, rememberFailure } from "./evolution.js";

describe("evolution and assurance engine", () => {
  it("degrades assurance without weakening safety", () => {
    expect(assuranceHomeostasis({ failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 0, latencyMs: 10, confidenceDegradation: 0 })).toBe("normal");
    expect(assuranceHomeostasis({ failureRate: 0.22, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 0, latencyMs: 10, confidenceDegradation: 0 })).toBe("restricted");
    expect(assuranceHomeostasis({ failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 1, latencyMs: 10, confidenceDegradation: 0 })).toBe("human-review");
  });

  it("finds counterexamples before commit", () => {
    const results = counterfactualCheck({ decision: "commit", identityVerified: false, authoritativeCompleted: true, evidencePresent: true, selectedSlotPrepared: true, contradiction: false });
    expect(results.some((item) => item.severity === "critical" && item.counterexampleFound)).toBe(true);
  });

  it("lets a challenger block an unsafe commit", () => {
    const result = challengeDecision({ decision: "commit", identityVerified: false, authoritativeCompleted: true, evidencePresent: true, contradiction: false });
    expect(result.passed).toBe(false);
    expect(result.objections).toContain("Identity is not verified.");
  });

  it("uses Pareto-style shadow comparison instead of trusting a score alone", () => {
    const comparison = compareShadowRuns({ reliability: 0.90, verificationCoverage: 0.90, latencyMs: 100, cost: 1 }, { reliability: 0.92, verificationCoverage: 0.92, latencyMs: 95, cost: 0.9 });
    expect(comparison.candidateDominates).toBe(true);
    expect(comparison.reliabilityDelta).toBeCloseTo(0.02);
  });

  it("never promotes without explicit authorization", () => {
    const candidate = createEvolutionCandidate({
      hypothesis: "Require a challenger before appointment commit.",
      failures: [{ id: "f1", category: "verification", summary: "missing evidence", occurredAt: new Date().toISOString() }],
      counterfactuals: [],
      challenger: { challengedDecision: "commit", objections: [], passed: true },
    });
    expect(candidate.promotion).toBe("shadow");
    expect(candidate.authorizationRequired).toBe(true);
  });

  it("negotiates only over prepared availability", () => {
    const slots = [{ date: "2026-09-15", time: "09:00" }, { date: "2026-09-15", time: "11:30" }, { date: "2026-09-16", time: "08:30" }];
    expect(negotiatePreparedSlot({ requestedDate: "2026-09-15", requestedTime: "11:30", availableSlots: slots }).selected).toEqual(slots[1]);
    expect(negotiatePreparedSlot({ requestedDate: "2026-09-15", requestedTime: "12:15", availableSlots: slots }).status).toBe("alternatives");
    expect(negotiatePreparedSlot({ requestedDate: "2026-09-18", requestedTime: "12:15", availableSlots: slots }).status).toBe("none");
  });

  it("deduplicates failure memory and builds a state manifest", () => {
    const event = { id: "f1", category: "unknown" as const, summary: "unclear result", occurredAt: new Date().toISOString() };
    expect(rememberFailure([event], event)).toHaveLength(1);
    const manifest = buildSystemStateManifest({ version: "1", provider: "CALL-E", capabilities: ["appointment_confirmation"], authorizationScope: ["appointment"], policyVersion: "v1", knownFailures: ["f1"], assuranceMode: "recovery-only", verificationState: "unverified", constraints: ["prepared-slots-only"], promotionState: "baseline" });
    expect(manifest.generatedAt).toBeTruthy();
    expect(manifest.authorizationScope).toContain("appointment");
  });
});
