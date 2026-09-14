import { createHash } from "node:crypto";
import { executeSyntheticRedTeam } from "./synthetic-red-team.js";
import { compareShadowRuns, evaluatePromotion, type ShadowComparison } from "./evolution.js";

export interface DigitalGenotype {
  reasoning: { r1: boolean; r2: boolean; r3: "titans" | "bounded" };
  memory: { coala: boolean; bitemporal: boolean; holographic: boolean; hdc: boolean };
  verification: { adversarialGate: boolean; formalVerifier: boolean };
  execution: { idempotency: boolean; readback: boolean };
  digest: string;
}

export interface MutationProposal {
  parentDigest: string;
  mutation: string;
  candidate: DigitalGenotype;
  redTeamPassed: boolean;
  benchmark: ShadowComparison;
  promotion: "reject" | "shadow" | "candidate";
  authorizationRequired: true;
}

function digest(input: Omit<DigitalGenotype, "digest">): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function createDigitalGenotype(): DigitalGenotype {
  const body = {
    reasoning: { r1: true, r2: true, r3: "titans" as const },
    memory: { coala: true, bitemporal: true, holographic: true, hdc: true },
    verification: { adversarialGate: true, formalVerifier: true },
    execution: { idempotency: true, readback: true },
  };
  return { ...body, digest: digest(body) };
}

/** Mutation creates a candidate only. It never changes runtime authorization. */
export function mutateGenotype(parent: DigitalGenotype, mutation: string): MutationProposal {
  const candidateBody = { ...parent, reasoning: { ...parent.reasoning, r3: "bounded" as const } };
  const { digest: _oldDigest, ...withoutDigest } = candidateBody;
  const candidate = { ...withoutDigest, digest: digest(withoutDigest) };
  const redTeam = executeSyntheticRedTeam();
  const baseline = { reliability: 0.98, verificationCoverage: 1, latencyMs: 120, cost: 0.01 };
  const candidateRun = { reliability: redTeam.passed ? 0.98 : 0.90, verificationCoverage: 1, latencyMs: 115, cost: 0.01 };
  const benchmark = compareShadowRuns(baseline, candidateRun);
  const promotion = evaluatePromotion(benchmark, redTeam.passed, []);
  return { parentDigest: parent.digest, mutation, candidate, redTeamPassed: redTeam.passed, benchmark, promotion, authorizationRequired: true };
}
