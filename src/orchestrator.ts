import type { Incident } from "./domain.js";
import { validateIncident, canResolve } from "./policy.js";
import { AuditLedger } from "./ledger.js";
import { simulateCall } from "./simulator.js";
import { executeWithCalle } from "./calle.js";
import { validateOutcome } from "./validation.js";
import { BitemporalMemoryStore } from "./bitemporal-memory.js";
import { reflectOnExecution, storeReflexionFinding, type ReflexionFinding } from "./reflexion.js";
import { buildClaimLedger, buildConversationContract, buildEvidenceGraph, evaluateTrajectory, scoreMonitorability } from "./assurance-fabric.js";

function failureOutcome(message: string) {
  return validateOutcome({ route_acceptance: "unknown", eta_update_time: "", escalation_needed: "urgent", evidence_summary: message, confidence: "unknown" });
}

export async function runIncident(incident: Incident, options: { live: boolean; ledger?: AuditLedger; reflexionMemory?: BitemporalMemoryStore<ReflexionFinding> } = { live: false }) {
  const ledger = options.ledger ?? new AuditLedger();
  const reflexionMemory = options.reflexionMemory ?? new BitemporalMemoryStore<ReflexionFinding>();
  const operationKey = `incident:${incident.id}:call:${incident.vehicleId}`;
  const contract = buildConversationContract(incident);
  const reserved = ledger.reserve(operationKey);
  if (reserved.state !== "detected") return { record: reserved, reused: true, outcome: reserved.outcome, reflexion: undefined, assurance: undefined };

  const policy = validateIncident(incident, options.live);
  if (!policy.allowed) {
    const record = ledger.transition(operationKey, "escalated", { outcome: failureOutcome(policy.reasons.join("; ")) });
    const reflexion = storeReflexionFinding(reflexionMemory, reflectOnExecution(incident, operationKey, { state: "escalated", policyPassed: false }));
    return { record, reused: false, outcome: record.outcome, reflexion, assurance: { contract, monitorability: 0, action: "recover / human review" as const } };
  }

  ledger.transition(operationKey, "validated");
  ledger.transition(operationKey, "approved");
  ledger.transition(operationKey, "calling");
  const trajectory: Parameters<typeof evaluateTrajectory>[0] = [
    { type: "observation", detail: "incident accepted", safe: true },
    { type: "retrieval", detail: "conversation contract loaded", safe: true },
    { type: "tool_selection", detail: options.live ? "CALL-E live execution" : "deterministic simulator", safe: true },
  ];

  try {
    const raw = options.live ? await executeWithCalle(incident, operationKey) : { outcome: simulateCall(incident) };
    const outcome = validateOutcome(raw.outcome);
    trajectory.push({ type: "model_output", detail: "structured outcome received", safe: true });
    trajectory.push({ type: "state_update", detail: "outcome validated", safe: true });
    const claims = buildClaimLedger(outcome, raw.callId);
    const graph = buildEvidenceGraph(claims);
    const monitorability = scoreMonitorability(claims, graph);
    // The existing policy/evidence/idempotency gate remains authoritative for the transaction.
    // Assurance analytics cannot silently replace it; an unsafe trajectory can only reduce authority.
    const state = canResolve(outcome) ? "resolved" : "escalated";
    if (state === "escalated") trajectory.push({ type: "escalation", detail: "transaction gate did not permit commit", safe: true });
    else trajectory.push({ type: "side_effect", detail: "logical transaction committed", safe: true });
    const trajectoryCheck = evaluateTrajectory(trajectory);
    const finalState = trajectoryCheck.safe ? state : "escalated";
    const patch = raw.callId !== undefined ? { callId: raw.callId, outcome } : { outcome };
    const record = ledger.transition(operationKey, finalState, patch);
    const reflexion = storeReflexionFinding(reflexionMemory, reflectOnExecution(incident, operationKey, { state: finalState, outcome, policyPassed: true }));
    return { record, reused: false, outcome, reflexion, assurance: { contract, claims, graph, monitorability, trajectory: trajectoryCheck } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CALL-E execution failure";
    trajectory.push({ type: "escalation", detail: message, safe: true });
    const record = ledger.transition(operationKey, "escalated", { outcome: failureOutcome(message) });
    const reflexion = storeReflexionFinding(reflexionMemory, reflectOnExecution(incident, operationKey, { state: "escalated", error: message, policyPassed: true }));
    return { record, reused: false, outcome: record.outcome, reflexion, assurance: { contract, monitorability: 0, action: "recover / human review" as const } };
  }
}
