import { CalleClient } from "@call-e/calle";
import type { CallCapability } from "./capability.js";
import type { CallOutcome, Incident } from "./domain.js";
import { APPOINTMENT_RESULT_SCHEMA, RESULT_SCHEMA } from "./domain.js";
import { validateOutcome } from "./validation.js";

export type CalleCallStatus = "queued" | "in_progress" | "completed" | "failed" | "canceled" | "unknown";

function extractStructuredResult(call: unknown): unknown {
  if (!call || typeof call !== "object") return undefined;
  const value = call as Record<string, unknown>;
  return value.structured_result ?? value.structuredResult ?? value.result;
}

function field(value: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) if (value[key] !== undefined) return value[key];
  return undefined;
}

function stringField(value: Record<string, unknown>, ...keys: string[]): string | undefined {
  const result = field(value, ...keys);
  return typeof result === "string" ? result : undefined;
}

function statusField(value: Record<string, unknown>): CalleCallStatus {
  const status = value.status;
  return status === "queued" || status === "in_progress" || status === "completed" || status === "failed" || status === "canceled"
    ? status
    : "unknown";
}

export async function executeWithCalle(
  incident: Incident,
  idempotencyKey: string,
  capability: CallCapability,
): Promise<{ callId?: string; status: CalleCallStatus; outcome: CallOutcome }> {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) throw new Error("CALLE_API_KEY is required for live mode");

  const client = new CalleClient({ apiKey });
  const region = incident.region ?? process.env.CALLE_REGION ?? "US";
  const locale = incident.locale ?? process.env.CALLE_LOCALE ?? "en-US";
  const appointment = incident.appointment;
  const isAppointmentCall = appointment !== undefined;
  const task = isAppointmentCall
    ? [
        "Make a natural, brief appointment-confirmation phone call on behalf of the clinic.",
        `Clinic: ${appointment.clinicName}`,
        `Patient: ${appointment.patientName}`,
        `Doctor: ${appointment.doctorName}`,
        `Appointment reference: ${appointment.appointmentReference}`,
        "Speak in natural Polish, like a courteous clinic receptionist. Do not sound like a survey, script, checklist, robot, or technical system.",
        `Start by introducing yourself as Anna from ${appointment.clinicName} and ask whether you are speaking with ${appointment.patientName}.`,
        `Then say you are calling about tomorrow's appointment and ask naturally whether the patient will attend the appointment with ${appointment.doctorName}.`,
        "After the patient confirms the appointment, ask whether this is their first visit to the clinic.",
        "If the patient says it is their first visit, naturally remind them to bring an identity document and to arrive about 30 minutes before the appointment to check in at reception and fill out the information form.",
        "After giving the first-visit information, ask: 'Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?' Adapt the grammatical form naturally if needed.",
        "If the patient has no questions, say naturally: 'W takim razie wizytę mamy potwierdzoną. Dziękuję za rozmowę i życzę miłego dnia.' Then end the call politely.",
        "Do not invent medical information, appointment details, costs, diagnoses, treatment advice, or any other facts not provided above.",
        "The purpose is only appointment confirmation and first-visit administrative information; do not ask unnecessary questions.",
      ].join("\n")
    : [
        "Coordinate the prepared route change as a fact-finding call.",
        `Vehicle: ${incident.vehicleId}`,
        `Incident: ${incident.closure}`,
        `Proposed route: ${incident.proposedRoute}`,
        `Maximum acceptable ETA: ${incident.maxEta}`,
        "Ask the recipient whether they accept exactly the proposed route and whether they can meet the maximum ETA.",
        "Do not authorize any other route, price, contract, or operational commitment.",
        "State only facts established by the conversation. Never invent an ETA, acceptance, evidence, or confidence.",
      ].join("\n");

  const providerIdempotencyKey = `${idempotencyKey}:capability:${capability.capabilityId}`;
  const call = await client.calls.createAndWait({
    task,
    recipients: [{ phones: [incident.phone], region, locale }],
    resultSchema: isAppointmentCall ? APPOINTMENT_RESULT_SCHEMA : RESULT_SCHEMA,
    metadata: {
      aegisfleet_operation_key: idempotencyKey,
      aegisfleet_capability_id: capability.capabilityId,
      aegisfleet_capability_constraints_digest: capability.constraintsDigest,
      aegisfleet_capability_endpoint_digest: capability.endpointDigest,
      aegisfleet_capability_expires_at: capability.expiresAt,
    },
  }, { idempotencyKey: providerIdempotencyKey });

  const callValue = call as unknown as Record<string, unknown>;
  const structured = extractStructuredResult(call);
  const evidenceValue = field(callValue, "evidence", "evidence_items");
  const evidence = Array.isArray(evidenceValue)
    ? evidenceValue.filter((item): item is string => typeof item === "string")
    : undefined;
  const taskCompleted = field(callValue, "task_completed", "taskCompleted");
  const completionConfidence = field(callValue, "completion_confidence", "completionConfidence");
  const failureCode = field(callValue, "failure_code", "failureCode");
  const failureMessage = field(callValue, "failure_message", "failureMessage");
  const rawOutcome = structured && typeof structured === "object"
    ? {
        ...(structured as Record<string, unknown>),
        ...(taskCompleted !== undefined ? { task_completed: taskCompleted } : {}),
        ...(completionConfidence !== undefined ? { completion_confidence: completionConfidence } : {}),
        ...(evidence !== undefined ? { evidence } : {}),
        ...(failureCode !== undefined ? { failure_code: failureCode } : {}),
        ...(failureMessage !== undefined ? { failure_message: failureMessage } : {}),
      }
    : {
        route: "",
        route_acceptance: "unknown",
        eta_update_time: "",
        escalation_needed: "urgent",
        evidence_summary: stringField(callValue, "failure_message", "failureMessage") ?? "CALL-E returned no structured result",
        ...(evidence !== undefined ? { evidence } : {}),
        confidence: "unknown",
        ...(taskCompleted !== undefined ? { task_completed: taskCompleted } : {}),
        ...(completionConfidence !== undefined ? { completion_confidence: completionConfidence } : {}),
        ...(failureCode !== undefined ? { failure_code: failureCode } : {}),
        ...(failureMessage !== undefined ? { failure_message: failureMessage } : {}),
      };

  const outcome = validateOutcome(rawOutcome);
  const callId = stringField(callValue, "id", "call_id", "callId");
  const status = statusField(callValue);
  return callId === undefined ? { status, outcome } : { callId, status, outcome };
}
