import type { CallOutcome } from "./domain.js";

const ROUTE_ACCEPTANCE = new Set(["yes", "no", "unknown"]);
const ESCALATION = new Set(["urgent", "normal", "none", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const REQUIRED_KEYS = new Set([
  "route_acceptance",
  "eta_update_time",
  "escalation_needed",
  "evidence_summary",
  "confidence",
]);

export function validateOutcome(value: unknown): CallOutcome {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("CALL-E result must be an object");
  }

  const v = value as Record<string, unknown>;
  for (const key of Object.keys(v)) {
    if (!REQUIRED_KEYS.has(key)) throw new Error(`Unexpected outcome field: ${key}`);
  }

  if (!ROUTE_ACCEPTANCE.has(String(v.route_acceptance))) throw new Error("Invalid route_acceptance");
  if (!ESCALATION.has(String(v.escalation_needed))) throw new Error("Invalid escalation_needed");
  if (!CONFIDENCE.has(String(v.confidence))) throw new Error("Invalid confidence");
  if (typeof v.eta_update_time !== "string") throw new Error("Invalid eta_update_time");
  if (typeof v.evidence_summary !== "string" || v.evidence_summary.trim().length === 0) throw new Error("Evidence is required");

  return {
    route_acceptance: v.route_acceptance as CallOutcome["route_acceptance"],
    eta_update_time: v.eta_update_time,
    escalation_needed: v.escalation_needed as CallOutcome["escalation_needed"],
    evidence_summary: v.evidence_summary,
    confidence: v.confidence as CallOutcome["confidence"],
  };
}
