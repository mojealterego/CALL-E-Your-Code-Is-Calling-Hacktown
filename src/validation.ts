import type { CallOutcome } from "./domain.js";

const ROUTE_ACCEPTANCE = new Set(["yes", "no", "unknown"]);
const ESCALATION = new Set(["urgent", "normal", "none", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);

export function validateOutcome(value: unknown): CallOutcome {
  if (!value || typeof value !== "object") throw new Error("CALL-E result must be an object");
  const v = value as Record<string, unknown>;
  if (typeof v.route !== "string") throw new Error("Invalid route");
  if (!ROUTE_ACCEPTANCE.has(String(v.route_acceptance))) throw new Error("Invalid route_acceptance");
  if (!ESCALATION.has(String(v.escalation_needed))) throw new Error("Invalid escalation_needed");
  if (!CONFIDENCE.has(String(v.confidence))) throw new Error("Invalid confidence");
  if (typeof v.eta_update_time !== "string") throw new Error("Invalid eta_update_time");
  if (typeof v.evidence_summary !== "string" || v.evidence_summary.trim().length === 0) throw new Error("Evidence is required");
  if (v.task_completed !== undefined && typeof v.task_completed !== "boolean") throw new Error("Invalid task_completed");
  if (v.completion_confidence !== undefined && typeof v.completion_confidence !== "string") throw new Error("Invalid completion_confidence");
  return {
    route: v.route,
    route_acceptance: v.route_acceptance as CallOutcome["route_acceptance"],
    eta_update_time: v.eta_update_time,
    escalation_needed: v.escalation_needed as CallOutcome["escalation_needed"],
    evidence_summary: v.evidence_summary,
    confidence: v.confidence as CallOutcome["confidence"],
    ...(v.task_completed !== undefined ? { task_completed: v.task_completed } : {}),
    ...(v.completion_confidence !== undefined ? { completion_confidence: v.completion_confidence } : {}),
    ...(typeof v.failure_code === "string" ? { failure_code: v.failure_code } : {}),
    ...(typeof v.failure_message === "string" ? { failure_message: v.failure_message } : {}),
  };
}
