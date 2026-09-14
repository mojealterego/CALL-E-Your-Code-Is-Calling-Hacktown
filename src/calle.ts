import { CalleClient } from "@call-e/calle";
import type { CallCapability } from "./capability.js";
import type { CallOutcome, Incident } from "./domain.js";
import { APPOINTMENT_RESULT_SCHEMA, RESULT_SCHEMA } from "./domain.js";
import { buildConversationContract } from "./assurance.js";
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
  const conversationContract = isAppointmentCall ? buildConversationContract(appointment.patientName) : undefined;

  const task = isAppointmentCall
    ? [
        "Conduct a natural, short Polish phone call as a courteous clinic receptionist. The conversation must sound like a real human receptionist, not a survey, IVR, checklist, scripted questionnaire, or technical agent.",
        `Conversation contract version=${conversationContract?.version ?? 1} digest=${conversationContract?.digest ?? "none"}. Execute only within this contract; the digest binds this call to the prepared identity, objective, allowed actions, forbidden actions, conditional evidence and commit conditions.`,
        `Clinic: ${appointment.clinicName}`,
        `Patient: ${appointment.patientName}`,
        `Doctor: ${appointment.doctorName}`,
        `Current appointment: ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
        `Appointment reference: ${appointment.appointmentReference}`,
        `Prepared replacement availability, and ONLY this availability: ${appointment.availableSlots.map((slot) => `${slot.date} at ${slot.time}`).join(", ")}. Never invent, infer, round, or promise another date or time.`,
        "Privacy rule: first establish that the person is the named patient. If the person is not the patient or identity remains unclear, do not disclose the doctor, appointment date, appointment time, or any other appointment detail. End politely and record patient_confirmed as no or unknown.",
        `Open naturally: introduce yourself as Anna from ${appointment.clinicName} and ask whether you are speaking with ${appointment.patientName}.`,
        `Only after the patient is confirmed, say naturally that you are calling about tomorrow's appointment with ${appointment.doctorName} and ask whether the patient will be able to attend. Do not recite the appointment reference.`,
        "If the patient WILL attend, ask naturally whether this is their first visit to the clinic.",
        "If it IS the first visit, naturally remind the patient to bring an identity document and arrive about 30 minutes before the appointment so they can check in at reception and fill out the information form.",
        "If it is NOT the first visit, simply acknowledge the answer. Do not mention the identity document, arriving 30 minutes early, registration, or the information form.",
        "After either attendance branch, ask naturally: 'Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?' If the patient has no questions, close naturally: 'W takim razie wizytę mamy potwierdzoną. Dziękuję za rozmowę i życzę miłego dnia.'",
        "If the patient says they cannot attend the current appointment, respond naturally: 'Rozumiem. W takim razie mogę sprawdzić najbliższy wolny termin.' Then offer the earliest prepared replacement slot with its date and time.",
        "If the patient says they no longer want the appointment, respond naturally, for example: 'Rozumiem. W takim razie odwołam tę wizytę.' Do not offer another slot after an explicit cancellation. End politely and record appointment_decision as cancel.",
        "When rescheduling, offer one prepared slot at a time, starting with the earliest available slot. Ask naturally whether that date and time would work for the patient. Do not dump a list of all slots unless the patient asks for alternatives.",
        "If the patient accepts the offered slot, say naturally that the appointment is booked for that date and time. Record the exact selected slot and appointment_decision as reschedule.",
        "If the patient rejects the offered time, say naturally: 'Rozumiem. A sam dzień panu odpowiada, tylko godzina nie?' If the day works, ask: 'Która godzina byłaby dla pana dogodna?' Accept the requested time only if that exact date/time exists in the prepared availability. If it does not exist, say that this hour is unfortunately unavailable and offer the available times for that same day.",
        "If the offered date does not work, acknowledge it and offer the next prepared available slot from a different date. Continue one short, natural exchange at a time until the patient accepts a prepared slot, explicitly cancels the appointment, or all prepared options are exhausted.",
        "If no prepared slot works, say naturally that none of the currently available times is suitable and that the clinic will need to arrange another contact. Never claim that a booking was made when it was not.",
        "If the patient gives an ambiguous answer, do not guess. Use the context and ask one short clarification question. If the patient changes their mind during the call, follow the latest clear intent.",
        "Never invent medical information, costs, diagnoses, treatment advice, appointment facts, availability, bookings, or confirmation. Never pressure the patient to attend or reschedule.",
        "Keep turns short. React to what the patient just said instead of reciting the next branch. Let the patient finish speaking; if the conversation moves outside the prepared administrative scope, politely state that the clinic can only help with the appointment matter in this call.",
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
      ...(conversationContract ? { aegisfleet_conversation_contract_version: String(conversationContract.version), aegisfleet_conversation_contract_digest: conversationContract.digest } : {}),
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
