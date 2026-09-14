import { CalleClient } from "@call-e/calle";
import type { CallOutcome, Incident } from "./domain.js";
import { RESULT_SCHEMA } from "./domain.js";
import { validateOutcome } from "./validation.js";

function redactPhone(phone: string): string {
  return phone.length < 5 ? "***" : `${phone.slice(0, 2)}***${phone.slice(-2)}`;
}

function extractStructuredResult(call: unknown): unknown {
  if (!call || typeof call !== "object") return undefined;
  const value = call as Record<string, unknown>;
  return value.structuredResult ?? value.result;
}

export async function executeWithCalle(
  incident: Incident,
  idempotencyKey: string,
): Promise<{ callId?: string; outcome: CallOutcome }> {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) throw new Error("CALLE_API_KEY is required for live mode");

  const client = new CalleClient({ apiKey });
  const task = [
    incident.goal,
    `Vehicle: ${incident.vehicleId}`,
    `Incident: ${incident.closure}`,
    `Recipient: ${redactPhone(incident.phone)}`,
    "State only facts established by the conversation.",
    "Never invent an ETA, acceptance, evidence, or confidence.",
  ].join("\n");

  const call = await client.calls.createAndWait({
    task,
    resultSchema: RESULT_SCHEMA,
    metadata: { aegisfleet_operation_key: idempotencyKey },
  });

  const structured = extractStructuredResult(call);
  const outcome = validateOutcome(structured);
  const callValue = call as unknown as Record<string, unknown>;
  const callId = typeof callValue.id === "string" ? callValue.id : undefined;
  return callId ? { callId, outcome } : { outcome };
}
