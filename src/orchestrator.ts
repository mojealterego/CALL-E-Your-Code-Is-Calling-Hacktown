import type { Incident } from "./domain.js";
import { validateIncident, canResolve } from "./policy.js";
import { AuditLedger } from "./ledger.js";
import { simulateCall } from "./simulator.js";
import { executeWithCalle } from "./calle.js";
import { validateOutcome } from "./validation.js";
import { BitemporalMemoryStore } from "./bitemporal-memory.js";
import { reflectOnExecution, storeReflexionFinding, type ReflexionFinding } from "./reflexion.js";

function failureOutcome(message: string) {
  return validateOutcome({
    route_acceptance: "unknown",
    eta_update_time: "",
    escalation_needed: "urgent",
    evidence_summary: message,
    confidence: "unknown",
  });
}

export async function runIncident(
  incident: Incident,
  options: {
    live: boolean;
    ledger?: AuditLedger;
    reflexionMemory?: BitemporalMemoryStore<ReflexionFinding>;
  } = { live: false },
) {
  const ledger = options.ledger ?? new AuditLedger();
  const reflexionMemory = options.reflexionMemory ?? new BitemporalMemoryStore<ReflexionFinding>();
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const reserved = ledger.reserve(operationKey);

  if (reserved.state !== "detected") {
    return { record: reserved, reused: true, outcome: reserved.outcome, reflexion: undefined };
  }

  const policy = validateIncident(incident, options.live);
  if (!policy.allowed) {
    const record = ledger.transition(operationKey, "escalated", {
      outcome: failureOutcome(policy.reasons.join("; ")),
    });
    const reflexion = storeReflexionFinding(
      reflexionMemory,
      reflectOnExecution(incident, operationKey, {
        state: "escalated",
        policyPassed: false,
      }),
    );
    return { record, reused: false, outcome: record.outcome, reflexion };
  }

  ledger.transition(operationKey, "validated");
  ledger.transition(operationKey, "approved");
  ledger.transition(operationKey, "calling");

  try {
    const raw = options.live
      ? await executeWithCalle(incident, operationKey)
      : { outcome: simulateCall(incident) };
    const outcome = validateOutcome(raw.outcome);
    const state = canResolve(outcome) ? "resolved" : "escalated";
    const patch = raw.callId !== undefined ? { callId: raw.callId, outcome } : { outcome };
    const record = ledger.transition(operationKey, state, patch);
    const reflexion = storeReflexionFinding(
      reflexionMemory,
      reflectOnExecution(incident, operationKey, {
        state,
        outcome,
        policyPassed: true,
      }),
    );
    return { record, reused: false, outcome, reflexion };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CALL-E execution failure";
    const record = ledger.transition(operationKey, "escalated", {
      outcome: failureOutcome(message),
    });
    const reflexion = storeReflexionFinding(
      reflexionMemory,
      reflectOnExecution(incident, operationKey, {
        state: "escalated",
        error: message,
        policyPassed: true,
      }),
    );
    return { record, reused: false, outcome: record.outcome, reflexion };
  }
}
