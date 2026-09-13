import { describe, expect, it } from "vitest";
import { WebhookDeduper, validateTerminalEvent } from "../src/webhook.js";

describe("webhook safety boundary", () => {
  it("accepts the current CALL-E terminal event envelope", () => {
    expect(validateTerminalEvent({
      id: "evt-1",
      type: "call.completed",
      data: { id: "call-1", status: "completed" },
    }, "evt-1")).toEqual({
      id: "evt-1",
      type: "call.completed",
      call_id: "call-1",
      status: "completed",
    });
  });

  it("rejects malformed, mismatched, or unsupported events", () => {
    expect(() => validateTerminalEvent({ id: "evt-1" })).toThrow();
    expect(() => validateTerminalEvent({
      id: "evt-1",
      type: "call.completed",
      data: { id: "call-1", status: "failed" },
    })).toThrow();
    expect(() => validateTerminalEvent({
      id: "evt-1",
      type: "call.completed",
      data: { id: "call-1", status: "completed" },
    }, "evt-2")).toThrow();
  });

  it("deduplicates repeated and blank provider event ids", () => {
    const deduper = new WebhookDeduper();
    expect(deduper.accept("evt-1")).toBe(true);
    expect(deduper.accept("evt-1")).toBe(false);
    expect(deduper.accept("   ")).toBe(false);
  });
});
