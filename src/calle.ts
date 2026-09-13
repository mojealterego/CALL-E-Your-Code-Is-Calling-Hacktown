import { CalleClient } from "@call-e/calle";
import type { CallOutcome, Incident } from "./domain.js";
import { RESULT_SCHEMA } from "./domain.js";
import { validateOutcome } from "./validation.js";

function extractStructuredResult(call: unknown): unknown {
  if (!call || typeof call !== "object") return undefined;
  const value = call as Record<string, unknown>;
  return value.structured_result ?? value.structuredResult ?? value.result;
}

function stringField(value: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) if (typeof value[key] === "string") return value[key];
  return undefined;
}

export async function executeWithCalle(
  incident: Incident,
  idempotencyKey: string,
): Promise<{ callId?: string; outcome: CallOutcome }> {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) throw new Error("CALLE_API_KEY is required for live mode");

  const client = new CalleClient({ apiKey });
  const region = incident.region ?? process.env.CALLE_REGION ?? "US";
  const locale = incident.locale ?? process.env.CALLE_LOCALE ?? "en-US";
  const task = [
    "Coordinate the prepared route change as a fact-finding call.",
    `Vehicle: ${incident.vehicleId}`,
    `Incident: ${incident.closure}`,
    `Proposed route: ${incident.proposedRoute}`,
    `Maximum acceptable ETA: ${incident.maxEta}`,
    "Ask the recipient whether they accept exactly the proposed route and whether they can meet the maximum ETA.",
    "Do not authorize any other route, price, contract, or operational commitment.",
    "State only facts established by the conversation. Never invent an ETA, acceptance, evidence, or confidence.",
  ].join("\n");

  const call = await client.calls.createAndWait({
    task,
    recipients: [{ phones: [incident.phone], region, locale }],
    resultSchema: RESULT_SCHEMA,
    metadata: { aegisfleet_operation_key: idempotencyKey },
  }, { idempotencyKey });

  const callValue = call as unknown as Record<string, unknown>;
  const structured = extractStructuredResult(call);
  const evidence = Array.isArray(callValue.evidence)
    ? callValue.evidence.filter((item): item is string => typeof item === "string")
    : undefined;
  const rawOutcome = structured && typeof structured === "object"
    ? {
        ...(structured as Record<string, unknown>),
        task_completed: callValue.task_completed,
        completion_confidence: callValue.completion_confidence,
        evidence,
        failure_code: callValue.failure_code,
        failure_message: callValue.failure_message,
      }
    : {
        route: "",
        route_acceptance: "unknown",
        eta_update_time: "",
        escalation_needed: "urgent",
        evidence_summary: stringField(callValue, "failure_message", "failureMessage") ?? "CALL-E returned no structured result",
        evidence,
        confidence: "unknown",
        task_completed: callValue.task_completed,
        completion_confidence: callValue.completion_confidence,
        failure_code: callValue.failure_code,
        failure_message: callValue.failure_message,
      };

  const outcome = validateOutcome(rawOutcome);
  return {
    callId: stringField(callValue, "id", "call_id", "callId"),
    outcome,
  };
}
