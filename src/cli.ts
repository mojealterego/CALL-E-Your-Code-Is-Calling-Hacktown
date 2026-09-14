import "dotenv/config";
import { runIncident } from "./orchestrator.js";
import { AuditLedger } from "./ledger.js";
import type { Incident } from "./domain.js";

const demoIncident: Incident = { id: "AF-DEMO-0001", vehicleId: "TRUCK-42", phone: "+15550123456", closure: "A4 highway closure affecting the planned route.", requestedBy: "dispatch-demo", proposedRoute: "B", maxEta: "19:00", goal: "Inform the driver about the A4 closure, verify acceptance of Route B, and confirm the revised ETA." };

const liveAppointmentIncident: Incident = {
  ...demoIncident,
  vehicleId: "PATIENT-ADAM-MIAUCZYNSKI",
  closure: "Administrative appointment confirmation.",
  requestedBy: "clinic-reception-demo",
  goal: "Confirm Adam Miauczyński's appointment, handle attendance or cancellation, and reschedule it when requested using only prepared availability.",
  appointment: {
    clinicName: "Przychodnia Medica Nova",
    patientName: "Adam Miauczyński",
    doctorName: "doktor Pawlak",
    appointmentReference: "TOMORROW-APPOINTMENT-001",
    appointmentDate: "2026-09-15",
    appointmentTime: "10:00",
    availableSlots: [
      { date: "2026-09-15", time: "09:00" },
      { date: "2026-09-15", time: "11:30" },
      { date: "2026-09-16", time: "08:30" },
      { date: "2026-09-16", time: "13:00" },
      { date: "2026-09-17", time: "10:30" },
    ],
  },
};

function isLiveCommand(command: string): boolean {
  const mode = (process.env.CALL_E_MODE ?? "dry-run").toLowerCase();
  if (command === "demo") return false;
  if (command === "live") { if (mode !== "live") throw new Error("Live execution requires CALL_E_MODE=live"); return true; }
  throw new Error(`Unknown command: ${command}. Use 'demo' or 'live'.`);
}

async function main() {
  const command = process.argv[2] ?? "demo";
  const live = isLiveCommand(command);
  const ledger = new AuditLedger();
  const incident = live ? { ...liveAppointmentIncident, phone: process.env.AEGIS_LIVE_PHONE ?? "" } : demoIncident;
  if (live && !incident.phone) throw new Error("AEGIS_LIVE_PHONE is required for live mode");
  console.log(`AegisFleet | mode=${live ? "LIVE" : "DRY-RUN"}`);
  if (incident.appointment) {
    console.log(`APPOINTMENT clinic=${incident.appointment.clinicName} doctor=${incident.appointment.doctorName}`);
    console.log(`PATIENT ${incident.appointment.patientName}`);
    console.log(`CURRENT ${incident.appointment.appointmentDate} ${incident.appointment.appointmentTime}`);
    console.log(`AVAILABLE ${incident.appointment.availableSlots.map((slot) => `${slot.date} ${slot.time}`).join(", ")}`);
  } else {
    console.log(`Incident=${incident.id} vehicle=${incident.vehicleId}`);
    console.log(`PREPARE route=${incident.proposedRoute} maxEta=${incident.maxEta}`);
  }
  const result = await runIncident(incident, { live, ledger });
  console.log(JSON.stringify({ state: result.record.state, transactionId: result.transaction?.transactionId ?? result.record.transactionId, decision: result.reconciliation?.decision ?? result.record.transactionDecision, reasons: result.reconciliation?.reasons ?? result.record.transactionReasons, reused: result.reused, operationKey: result.record.operationKey, callId: result.record.callId, outcome: result.outcome, receipt: result.receipt ?? result.record.transactionReceipt, auditDigest: result.record.auditDigest, previousAuditDigest: result.record.previousAuditDigest, callsPlaced: live ? (result.record.callId ? 1 : 0) : 0 }, null, 2));
  if (!live) console.log("DRY-RUN GUARANTEE: no provider request and no phone call were made.");
  if (live && !result.record.callId) throw new Error("Live CALL-E test did not create a call task; no outbound call was placed.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
