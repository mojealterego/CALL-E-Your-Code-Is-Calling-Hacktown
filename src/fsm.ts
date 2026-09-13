import type { IncidentState } from "./domain.js";

const allowed: Record<IncidentState, IncidentState[]> = {
  detected: ["validated", "escalated"],
  validated: ["prepared", "escalated"],
  prepared: ["calling", "escalated"],
  calling: ["verifying", "recovering", "escalated"],
  verifying: ["resolved", "recovering", "escalated"],
  resolved: [],
  escalated: [],
  recovering: [],
};

export function assertTransition(from: IncidentState, to: IncidentState): void {
  if (!allowed[from].includes(to)) throw new Error(`Invalid incident transition: ${from} -> ${to}`);
}
