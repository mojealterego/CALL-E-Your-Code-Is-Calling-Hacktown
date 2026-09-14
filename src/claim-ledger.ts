import { createHash } from "node:crypto";
import type { Claim, ClaimLedger, EpistemicStatus } from "./assurance.js";

export interface VerificationDecision {
  verified: boolean;
  status: EpistemicStatus;
  reason: string;
  authoritativeEvidence: string[];
}

/**
 * Converts a conversational claim into a verified claim only when an
 * authoritative check explicitly agrees with its value. No inference or
 * model confidence is sufficient for this transition.
 */
export function verifyClaim(
  claim: Claim,
  check: { source: "authoritative" | "human"; value: string; evidenceRefs: string[]; fresh: boolean },
): { claim: Claim; decision: VerificationDecision } {
  if (!check.fresh) {
    return {
      claim: { ...claim, status: "stale" },
      decision: { verified: false, status: "stale", reason: "authoritative evidence is stale", authoritativeEvidence: check.evidenceRefs },
    };
  }
  if (check.value !== claim.value) {
    return {
      claim: { ...claim, status: "contradicted", source: check.source, authority: "authoritative", evidenceRefs: [...claim.evidenceRefs, ...check.evidenceRefs], provenance: [...claim.provenance, check.source] },
      decision: { verified: false, status: "contradicted", reason: "authoritative evidence conflicts with conversational claim", authoritativeEvidence: check.evidenceRefs },
    };
  }
  const verifiedClaim: Claim = {
    ...claim,
    id: `claim_${createHash("sha256").update(JSON.stringify({ claim: claim.id, source: check.source, evidence: check.evidenceRefs })).digest("hex").slice(0, 16)}`,
    status: "verified",
    source: check.source,
    authority: "authoritative",
    evidenceRefs: [...claim.evidenceRefs, ...check.evidenceRefs],
    provenance: [...claim.provenance, check.source, ...check.evidenceRefs],
  };
  return {
    claim: verifiedClaim,
    decision: { verified: true, status: "verified", reason: "authoritative evidence agrees with conversational claim", authoritativeEvidence: check.evidenceRefs },
  };
}

export function rebuildLedgerAfterVerification(claims: Claim[]): ClaimLedger {
  const conflicts = claims.filter((claim) => claim.status === "contradicted");
  const verified = claims.filter((claim) => claim.status === "verified");
  const required = ["patient.confirmed", "appointment.decision", "appointment.doctor", "conversation.completed"];
  const commitAllowed = conflicts.length === 0 && required.every((predicate) => claims.some((claim) => claim.predicate === predicate && claim.status === "verified"));
  return { claims, verified, conflicts, commitAllowed };
}
