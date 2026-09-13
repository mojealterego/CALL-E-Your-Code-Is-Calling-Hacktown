import { describe, expect, it } from "vitest";
import { assuranceHomeostasis, authorizationFromTrust, buildSystemStateManifest, challengeDecision, classifyFailure, compareShadowRuns, createEvolutionCandidate, createSandboxArtifact, createSemanticCacheEntry, degradeTrust, destroySandboxArtifact, detectDrift, evaluateFreshness, loadShedding, negotiatePreparedSlot, providerHandshake, replayAssuranceCases, rememberFailure, SAFETY_INVARIANTS } from "./evolution.js";

describe("evolution and assurance engine", () => {
  it("degrades assurance without weakening safety", () => {
    expect(assuranceHomeostasis({ failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 0, latencyMs: 10, confidenceDegradation: 0 })).toBe("normal");
    expect(assuranceHomeostasis({ failureRate: 0.22, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 0, latencyMs: 10, confidenceDegradation: 0 })).toBe("restricted");
    expect(assuranceHomeostasis({ failureRate: 0, unknownRate: 0, recoveryRate: 0, contradictionRate: 0, providerErrorRate: 0, verificationFailureRate: 0, duplicateExecutionAttempts: 1, latencyMs: 10, confidenceDegradation: 0 })).toBe("human-review");
  });

  it("finds counterexamples before commit", () => {
    const results = (await import("./evolution.js")).counterfactualCheck({ decision: "commit", identityVerified: false, authoritativeCompleted: true, evidencePresent: true, selectedSlotPrepared: true, contradiction: false });
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
    const candidate = createEvolutionCandidate({ hypothesis: "Require a challenger before appointment commit.", failures: [{ id: "f1", category: "verification", summary: "missing evidence", occurredAt: new Date().toISOString() }], counterfactuals: [], challenger: { challengedDecision: "commit", objections: [], passed: true } });
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
    const manifest = buildSystemStateManifest({ version: "1", provider: "CALL-E", capabilities: ["appointment_confirmation"], authorizationScope: ["appointment"], policyVersion: "v1", knownFailures: ["f1"], assuranceMode: "recovery-only", verificationState: "unverified", constraints: ["prepared-slots-only"], promotionState: "baseline", trustLevel: "restricted", authorizationDecision: "denied", freshnessState: "stale" });
    expect(manifest.generatedAt).toBeTruthy();
    expect(manifest.authorizationScope).toContain("appointment");
  });

  it("classifies failures and replays hard negatives as recovery", () => {
    expect(classifyFailure({ duplicate: true })).toBe("duplicate");
    expect(classifyFailure({ verificationFailure: true })).toBe("verification");
    const results = replayAssuranceCases([{ id: "unsafe-identity", decision: "commit", identityVerified: false, authoritativeCompleted: true, evidencePresent: true, selectedSlotPrepared: true, contradiction: false, expectedSafeDecision: "recover" }, { id: "safe", decision: "commit", identityVerified: true, authoritativeCompleted: true, evidencePresent: true, selectedSlotPrepared: true, contradiction: false, expectedSafeDecision: "commit" }]);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("degrades trust without ever turning trust into authorization", () => {
    expect(degradeTrust("trusted", "verification")).toBe("untrusted");
    expect(authorizationFromTrust("degraded", true)).toBe("denied");
    expect(authorizationFromTrust("trusted", false)).toBe("unknown");
  });

  it("keeps semantic cache explicitly ineligible for authorization", () => {
    const entry = createSemanticCacheEntry("appointment", "tomorrow", 60_000, ["claim-1"]);
    expect(entry.authorizationEligible).toBe(false);
  });

  it("detects temporal staleness and drift", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    expect(evaluateFreshness("2026-09-14T11:59:00.000Z", now, 120_000).state).toBe("fresh");
    expect(evaluateFreshness("2026-09-14T11:50:00.000Z", now, 120_000).state).toBe("stale");
    expect(detectDrift([0.9, 0.91], [0.6, 0.61], 0.2).drifted).toBe(true);
  });

  it("requires a provider handshake before trusting execution semantics", () => {
    expect(providerHandshake({ provider: "CALL-E", schemaVersion: "v1", capabilities: ["voice"], supportedOperations: ["call"], verificationSemantics: "authoritative-readback", idempotency: "supported", limitsKnown: true }).accepted).toBe(true);
    expect(providerHandshake({ provider: "unknown", schemaVersion: "v0", capabilities: [], supportedOperations: [], verificationSemantics: "unverified", idempotency: "unsupported", limitsKnown: false }).accepted).toBe(false);
  });

  it("sheds optional work while preserving verification", () => {
    const result = loadShedding("normal", 0.95);
    expect(result.dropOptionalWork).toBe(true);
    expect(result.preserveVerification).toBe(true);
  });

  it("models throwaway sandbox artifacts with explicit destruction", () => {
    const artifact = createSandboxArtifact("candidate-1", 60_000, new Date("2026-09-14T12:00:00.000Z"));
    expect(destroySandboxArtifact(artifact).destroyed).toBe(true);
  });

  it("keeps non-overridable safety invariants explicit", () => {
    expect(SAFETY_INVARIANTS).toContain("CAPABILITY_NEVER_GRANTS_AUTHORIZATION");
    expect(SAFETY_INVARIANTS).toContain("UNKNOWN_NEVER_MEANS_SUCCESS");
    expect(SAFETY_INVARIANTS).toContain("ONE_LOGICAL_TRANSACTION_MAX_ONE_EXTERNAL_EXECUTION");
  });
});
