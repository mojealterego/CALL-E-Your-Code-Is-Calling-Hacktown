import { describe, expect, it } from "vitest";
import { createCallCapability, isCapabilityActive, verifyCapabilityBinding } from "../src/capability.js";

describe("call capabilities", () => {
  const now = new Date("2026-09-13T12:00:00.000Z");
  const input = {
    operationKey: "op-I-42",
    participantId: "TRUCK-42",
    scope: "route_change" as const,
    constraints: { route: "B", maxEta: "19:00" },
    now,
  };

  it("binds one capability to one operation and constraint set", () => {
    const capability = createCallCapability(input);
    expect(capability.capabilityId).toMatch(/^cap_[a-f0-9]{24}$/);
    expect(verifyCapabilityBinding(capability, input)).toBe(true);
    expect(verifyCapabilityBinding(capability, { ...input, constraints: { route: "C", maxEta: "19:00" } })).toBe(false);
  });

  it("expires capabilities instead of allowing indefinite reuse", () => {
    const capability = createCallCapability(input);
    expect(isCapabilityActive(capability, new Date("2026-09-13T12:04:59.000Z"))).toBe(true);
    expect(isCapabilityActive(capability, new Date("2026-09-13T12:05:00.000Z"))).toBe(false);
  });
});
