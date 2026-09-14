import { createHash } from "node:crypto";
import { constitutionalEvaluate, type ConstitutionalRule, type FormalInvariant } from "./advanced-cognitive-stack.js";

/**
 * Bounded integration boundary inspired by ImandraX-style automated reasoning and
 * MARS (Metacognitive Agent Reflective Self-improvement). This is not a reimplementation
 * of the proprietary ImandraX engine. It produces a deterministic proof-request bundle
 * and a fail-closed local gate that can be replaced by an authorized ImandraX adapter.
 */
export interface FormalProofRequest {
  id: string;
  claim: string;
  state: Record<string, unknown>;
  invariants: string[];
}

export interface FormalProofResult {
  proved: boolean;
  counterexample?: Record<string, unknown>;
  reason: string;
}

export function buildImandraXProofRequest(
  claim: string,
  state: Record<string, unknown>,
  invariants: FormalInvariant[],
): FormalProofRequest {
  const payload = JSON.stringify({ claim, state, invariants: invariants.map((x) => x.id) });
  return {
    id: createHash("sha256").update(payload).digest("hex").slice(0, 24),
    claim,
    state: { ...state },
    invariants: invariants.map((x) => x.id),
  };
}

export function localFormalGate(
  state: Record<string, unknown>,
  invariants: FormalInvariant[],
): FormalProofResult {
  const failed = invariants.filter((invariant) => !invariant.check(state)).map((invariant) => invariant.id);
  return failed.length === 0
    ? { proved: true, reason: "all declared invariants passed" }
    : { proved: false, counterexample: { failedInvariants: failed }, reason: "declared invariant failed" };
}

export interface MARSReflection {
  principleRules: string[];
  proceduralSteps: string[];
  revisedPolicy: string;
}

export interface MARSResult {
  accepted: boolean;
  reflection: MARSReflection;
  formal: FormalProofResult;
  constitutional: { allowed: boolean; failed: string[] };
}

/** One bounded reflection cycle: observe -> abstract principle -> procedure -> formal gate -> accept/refuse. */
export function marsCycle(
  observation: string,
  failureModes: string[],
  procedure: string[],
  state: Record<string, unknown>,
  invariants: FormalInvariant[],
  constitutionalRules: ConstitutionalRule[],
): MARSResult {
  const principleRules = [...new Set(failureModes.map((x) => x.trim()).filter(Boolean))].map(
    (x) => `avoid:${x}`,
  );
  const proceduralSteps = procedure.map((x) => x.trim()).filter(Boolean).slice(0, 16);
  const formal = localFormalGate(state, invariants);
  const constitutional = constitutionalEvaluate({ observation, state, principleRules }, constitutionalRules);
  return {
    accepted: formal.proved && constitutional.allowed,
    reflection: {
      principleRules,
      proceduralSteps,
      revisedPolicy: [...principleRules, ...proceduralSteps].join(" -> "),
    },
    formal,
    constitutional,
  };
}

export interface MARSControllerState {
  cycle: number;
  lastAccepted: boolean;
  policyHash: string;
}

export class MARSController {
  private state: MARSControllerState = { cycle: 0, lastAccepted: false, policyHash: "" };

  run(input: Parameters<typeof marsCycle>): MARSResult {
    const result = marsCycle(...input);
    this.state = {
      cycle: this.state.cycle + 1,
      lastAccepted: result.accepted,
      policyHash: createHash("sha256").update(result.reflection.revisedPolicy).digest("hex"),
    };
    return result;
  }

  snapshot(): MARSControllerState { return { ...this.state }; }
}
