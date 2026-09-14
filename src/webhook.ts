export type CalleWebhookStatus = "queued" | "in_progress" | "completed" | "failed" | "canceled";

export interface CalleTerminalEvent {
  id: string;
  type: "call.completed" | "call.failed" | "call.canceled";
  call_id: string;
  status: "completed" | "failed" | "canceled";
  created_at?: string;
}

export class WebhookDeduper {
  private readonly seen = new Set<string>();

  accept(eventId: string): boolean {
    const normalized = eventId.trim();
    if (!normalized || this.seen.has(normalized)) return false;
    this.seen.add(normalized);
    return true;
  }
}

export function validateTerminalEvent(value: unknown, headerEventId?: string): CalleTerminalEvent {
  if (!value || typeof value !== "object") throw new Error("Invalid webhook body");
  const event = value as Record<string, unknown>;
  const data = event.data;
  if (!data || typeof data !== "object") throw new Error("Webhook data envelope is required");
  const payload = data as Record<string, unknown>;
  if (typeof event.id !== "string" || typeof event.type !== "string" || typeof payload.id !== "string" || typeof payload.status !== "string") {
    throw new Error("Webhook body does not match the CALL-E event contract");
  }
  if (headerEventId !== undefined && headerEventId !== event.id) {
    throw new Error("CALL-E-Event-Id header does not match event id");
  }
  const status = payload.status;
  const type = event.type;
  if (type === "call.completed" && status !== "completed") throw new Error("Completed event has non-completed status");
  if (type === "call.failed" && status !== "failed") throw new Error("Failed event has non-failed status");
  if (type === "call.canceled" && status !== "canceled") throw new Error("Canceled event has non-canceled status");
  if (!["call.completed", "call.failed", "call.canceled"].includes(type)) {
    throw new Error(`Unsupported terminal event type: ${type}`);
  }
  return {
    id: event.id,
    type: type as CalleTerminalEvent["type"],
    call_id: payload.id,
    status: status as CalleTerminalEvent["status"],
    ...(typeof event.created_at === "string" ? { created_at: event.created_at } : {}),
  };
}
