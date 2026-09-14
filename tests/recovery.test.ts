import { describe, expect, it, vi } from "vitest";
import { fetchAuthoritativeCall, recoverIncident } from "../src/recovery.js";
import { AuditLedger } from "../src/ledger.js";

const incident = {
  id: "I-42",
  vehicleId: "TRUCK-42",
  phone: "+48123456789",
  closure: "A4 closure",
  requestedBy: "dispatch",
  goal: "Verify Route B acceptance and revised ETA.",
  proposedRoute: "B",
  maxEta: "19:00",
};

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

  it("resumes a recovering operation without making a second outbound call", async () => {
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

    const ledger = new AuditLedger();
    const key = `incident:${incident.id}:call:${incident.vehicleId}`;
    ledger.reserve(key);
    ledger.transition(key, "validated");
    ledger.transition(key, "prepared", { transactionId: "TX-I-42" });
    ledger.transition(key, "calling");
    ledger.transition(key, "verifying", { callId: "call_123" });
    ledger.transition(key, "recovering", { callId: "call_123" });

    const result = await recoverIncident(incident, ledger, "secret");
    expect(result.record.state).toBe("resolved");
    expect(result.reconciliation.decision).toBe("commit");
    expect(result.record.callId).toBe("call_123");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
