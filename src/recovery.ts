import type { CallOutcome } from "./domain.js";
import { validateOutcome } from "./validation.js";
import type { CalleCallStatus } from "./calle.js";

export interface AuthoritativeCall {
  id: string;
  status: CalleCallStatus;
  outcome: CallOutcome;
}

function statusOf(value: unknown): CalleCallStatus {
  return value === "queued" || value === "in_progress" || value === "completed" || value === "failed" || value === "canceled"
    ? value
    : "unknown";
}

export async function fetchAuthoritativeCall(callId: string, apiKey = process.env.CALLE_API_KEY): Promise<AuthoritativeCall> {
  if (!apiKey) throw new Error("CALLE_API_KEY is required for authoritative recovery");
  if (!/^call_[A-Za-z0-9_-]+$/.test(callId)) throw new Error("invalid CALL-E call id");

  const response = await fetch(`https://api.heycall-e.com/v1/calls/${encodeURIComponent(callId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`CALL-E authoritative fetch failed: HTTP ${response.status}`);

  const body = await response.json() as Record<string, unknown>;
  const status = statusOf(body.status);
  const structured = body.structured_result;
  const raw = structured && typeof structured === "object"
    ? {
        ...(structured as Record<string, unknown>),
        ...(body.task_completed !== null && body.task_completed !== undefined ? { task_completed: body.task_completed } : {}),
        ...(body.completion_confidence !== null && body.completion_confidence !== undefined ? { completion_confidence: body.completion_confidence } : {}),
        ...(Array.isArray(body.evidence) ? { evidence: body.evidence.filter((item): item is string => typeof item === "string") } : {}),
        ...(typeof body.failure_code === "string" ? { failure_code: body.failure_code } : {}),
        ...(typeof body.failure_message === "string" ? { failure_message: body.failure_message } : {}),
      }
    : {
        route: "",
        route_acceptance: "unknown",
        eta_update_time: "",
        escalation_needed: "urgent",
        evidence_summary: typeof body.failure_message === "string" ? body.failure_message : "CALL-E authoritative result is unavailable",
        confidence: "unknown",
        ...(Array.isArray(body.evidence) ? { evidence: body.evidence.filter((item): item is string => typeof item === "string") } : {}),
        ...(body.task_completed !== null && body.task_completed !== undefined ? { task_completed: body.task_completed } : {}),
        ...(body.completion_confidence !== null && body.completion_confidence !== undefined ? { completion_confidence: body.completion_confidence } : {}),
      };

  return { id: callId, status, outcome: validateOutcome(raw) };
}
