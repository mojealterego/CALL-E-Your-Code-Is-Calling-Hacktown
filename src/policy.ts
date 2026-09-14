import type { Incident } from "./domain.js";

export interface PolicyDecision { allowed: boolean; reasons: string[]; }
const E164 = /^\+[1-9]\d{7,14}$/;
const FIXTURE_PHONE_PATTERNS = [/^\+1555\d+$/, /example/i, /test/i, /fixture/i];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
function hasText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }

export function validateIncident(incident: Incident, live: boolean): PolicyDecision {
  const reasons: string[] = [];
  if (!hasText(incident.id) || !hasText(incident.vehicleId) || !hasText(incident.requestedBy)) reasons.push("missing required incident identity");
  if (!E164.test(incident.phone)) reasons.push("phone must be E.164 formatted");
  if (!hasText(incident.closure)) reasons.push("incident context is required");

  if (incident.appointment) {
    if (!hasText(incident.appointment.clinicName) || !hasText(incident.appointment.patientName) || !hasText(incident.appointment.doctorName)) {
      reasons.push("appointment clinic, patient and doctor are required");
    }
    if (!ISO_DATE.test(incident.appointment.appointmentDate) || !CLOCK.test(incident.appointment.appointmentTime)) reasons.push("current appointment date and time are invalid");
    if (!Array.isArray(incident.appointment.availableSlots) || incident.appointment.availableSlots.length === 0) reasons.push("appointment availability is required");
    else if (incident.appointment.availableSlots.some((slot) => !ISO_DATE.test(slot.date) || !CLOCK.test(slot.time))) reasons.push("appointment availability contains an invalid date or time");
  } else {
    const goal = incident.goal.toLowerCase();
    for (const requiredTerm of ["route", "eta"]) if (!goal.includes(requiredTerm)) reasons.push(`goal must explicitly include ${requiredTerm} coordination`);
  }

  if (live && FIXTURE_PHONE_PATTERNS.some((pattern) => pattern.test(incident.phone))) reasons.push("fixture/example/test phone numbers are forbidden in live mode");
  return { allowed: reasons.length === 0, reasons };
}

export function canResolve(outcome: {
  route_acceptance: string;
  eta_update_time: string;
  escalation_needed: string;
  evidence_summary: string;
  confidence: string;
}): boolean {
  return outcome.route_acceptance === "yes" && outcome.eta_update_time.trim().length > 0 && outcome.escalation_needed === "none" && outcome.evidence_summary.trim().length > 0 && outcome.confidence === "high";
}
