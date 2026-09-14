import type { CallOutcome, Incident } from "./domain.js";
import type { BitemporalMemory, BitemporalMemoryStore } from "./bitemporal-memory.js";

export type ReflexionFindingKind =
  | "policy_failure"
  | "execution_failure"
  | "validation_failure"
  | "uncertain_outcome"
  | "safe_resolution";

export interface ExecutionAssessment {
  state: "resolved" | "escalated";
  outcome?: CallOutcome;
  error?: string;
  policyPassed: boolean;
}

export interface ReflexionFinding {
  kind: ReflexionFindingKind;
  incidentId: string;
  operationKey: string;
  observation: string;
  correction: string;
  safeToAutoResolve: false;
}

export function reflectOnExecution(
  incident: Incident,
  operationKey: string,
  assessment: ExecutionAssessment,
): ReflexionFinding {
  if (!assessment.policyPassed) {
    return finding("policy_failure", incident, operationKey,
      "Policy gate rejected the operation.",
      "Preserve escalation; do not retry or reinterpret the policy decision.");
  }
  if (assessment.error) {
    return finding("execution_failure", incident, operationKey,
      assessment.error,
      "Escalate and require an explicit replay-safe retry decision.");
  }
  if (!assessment.outcome) {
    return finding("validation_failure", incident, operationKey,
      "Execution produced no validated outcome.",
      "Treat the result as unknown and escalate rather than infer success.");
  }

  const safe = assessment.state === "resolved"
    && assessment.outcome.route_acceptance === "yes"
    && assessment.outcome.eta_update_time.trim().length > 0
    && assessment.outcome.escalation_needed === "none"
    && assessment.outcome.evidence_summary.trim().length > 0
    && assessment.outcome.confidence === "high";

  return finding(
    safe ? "safe_resolution" : "uncertain_outcome",
    incident,
    operationKey,
    safe ? "All resolution gates were satisfied." : "Outcome did not satisfy every resolution gate.",
    safe
      ? "Retain evidence and audit state; no corrective action is required."
      : "Escalate and preserve the outcome as evidence; never promote uncertainty to resolution.",
  );
}

export function storeReflexionFinding(
  store: BitemporalMemoryStore<ReflexionFinding>,
  finding: ReflexionFinding,
  recordedAt = new Date().toISOString(),
): BitemporalMemory<ReflexionFinding> {
  return store.put({
    id: `${finding.operationKey}:${recordedAt}`,
    kind: "episodic",
    value: finding,
    validFrom: recordedAt,
    recordedAt,
  });
}

function finding(
  kind: ReflexionFindingKind,
  incident: Incident,
  operationKey: string,
  observation: string,
  correction: string,
): ReflexionFinding {
  return { kind, incidentId: incident.id, operationKey, observation, correction, safeToAutoResolve: false };
}
