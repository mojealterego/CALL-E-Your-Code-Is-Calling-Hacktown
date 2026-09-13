import { createHash } from "node:crypto";

export type CapabilityScope = "route_change";

export interface CallCapability {
  version: "1";
  capabilityId: string;
  operationKey: string;
  participantId: string;
  scope: CapabilityScope;
  constraintsDigest: string;
  issuedAt: string;
  expiresAt: string;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * Creates a non-secret, operation-scoped capability fingerprint.
 * It binds the phone operation to the prepared participant and constraints.
 * This is an authorization artifact, not an identity or voice biometric proof.
 */
export function createCallCapability(input: {
  operationKey: string;
  participantId: string;
  scope: CapabilityScope;
  constraints: unknown;
  now?: Date;
  ttlSeconds?: number;
}): CallCapability {
  const now = input.now ?? new Date();
  const ttlSeconds = input.ttlSeconds ?? 300;
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 3600) {
    throw new Error("capability TTL must be between 1 and 3600 seconds");
  }
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
  const constraintsDigest = digest({ participantId: input.participantId, scope: input.scope, constraints: input.constraints });
  const capabilityId = `cap_${digest({ operationKey: input.operationKey, constraintsDigest, issuedAt }).slice(0, 24)}`;
  return {
    version: "1",
    capabilityId,
    operationKey: input.operationKey,
    participantId: input.participantId,
    scope: input.scope,
    constraintsDigest,
    issuedAt,
    expiresAt,
  };
}

export function isCapabilityActive(capability: CallCapability, now = new Date()): boolean {
  return now.getTime() >= Date.parse(capability.issuedAt) && now.getTime() < Date.parse(capability.expiresAt);
}

export function verifyCapabilityBinding(
  capability: CallCapability,
  input: { operationKey: string; participantId: string; scope: CapabilityScope; constraints: unknown },
): boolean {
  if (capability.operationKey !== input.operationKey) return false;
  if (capability.participantId !== input.participantId) return false;
  if (capability.scope !== input.scope) return false;
  return capability.constraintsDigest === digest({
    participantId: input.participantId,
    scope: input.scope,
    constraints: input.constraints,
  });
}
