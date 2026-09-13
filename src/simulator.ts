import type { CallOutcome, Incident } from "./domain.js";

export function simulateCall(incident: Incident): CallOutcome {
  const eta = "18:40";
  return {
    route: incident.proposedRoute,
    route_acceptance: "yes",
    eta_update_time: eta,
    escalation_needed: "none",
    evidence_summary: `Driver confirmed ${incident.proposedRoute} and stated that the revised ETA is ${eta}.`,
    evidence: [`Driver accepted ${incident.proposedRoute}.`, `Driver stated revised ETA ${eta}.`],
    confidence: "high",
    task_completed: true,
    completion_confidence: "high",
  };
}
