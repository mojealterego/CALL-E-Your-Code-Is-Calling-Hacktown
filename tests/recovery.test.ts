import { describe, expect, it, vi } from "vitest";
import { fetchAuthoritativeCall } from "../src/recovery.js";

describe("authoritative recovery", () => {
  it("refuses recovery without a server credential", async () => {
    await expect(fetchAuthoritativeCall("call_123", "")).rejects.toThrow(/CALLE_API_KEY/);
  });

  it("re-fetches authoritative terminal state and evidence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "call_123",
      status: "completed",
      structured_result: {
        route: "B",
        route_acceptance: "yes",
        eta_update_time: "18:40",
        escalation_needed: "none",
        evidence_summary: "Driver accepted Route B.",
        confidence: "high",
      },
      task_completed: true,
      completion_confidence: { score: 0.92, label: "high" },
      evidence: ["Driver accepted Route B."],
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const result = await fetchAuthoritativeCall("call_123", "secret");
    expect(result.id).toBe("call_123");
    expect(result.status).toBe("completed");
    expect(result.outcome.route_acceptance).toBe("yes");
    expect(result.outcome.task_completed).toBe(true);
  });
});
