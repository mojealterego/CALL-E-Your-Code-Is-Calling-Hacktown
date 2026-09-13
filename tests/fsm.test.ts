import { describe, expect, it } from "vitest";
import { assertTransition } from "../src/fsm.js";

describe("incident state machine", () => {
  it("accepts the governed transaction lifecycle", () => {
    expect(() => assertTransition("detected", "validated")).not.toThrow();
    expect(() => assertTransition("validated", "prepared")).not.toThrow();
    expect(() => assertTransition("prepared", "calling")).not.toThrow();
    expect(() => assertTransition("calling", "verifying")).not.toThrow();
    expect(() => assertTransition("verifying", "resolved")).not.toThrow();
    expect(() => assertTransition("calling", "recovering")).not.toThrow();
  });

  it("rejects terminal-state regression", () => {
    expect(() => assertTransition("resolved", "calling")).toThrow(/Invalid incident transition/);
    expect(() => assertTransition("escalated", "validated")).toThrow(/Invalid incident transition/);
    expect(() => assertTransition("recovering", "calling")).toThrow(/Invalid incident transition/);
  });
});
