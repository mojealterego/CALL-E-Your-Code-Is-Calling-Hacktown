import { createHash } from "node:crypto";

/**
 * Governed implementations for capabilities 34-69. These are bounded contracts,
 * simulations and gates: they never mutate source, credentials or policy and never
 * authorize a live phone action by themselves.
 */

export type EvolutionGate = "sandbox" | "redTeam" | "formal" | "benchmark" | "shadow" | "approval";
export interface EvolutionProposal { id: string; parentVersion: string; mutation: string; generation: number; expectedGain: number; computeCost: number; riskPenalty: number; }
export interface EvolutionEvaluation { proposal: EvolutionProposal; gates: Record<EvolutionGate, boolean>; fitness: number; accepted: boolean; reason: string; }

export function evolutionFitness(expectedGain: number, computeCost: number, riskPenalty: number): number {
  return expectedGain - computeCost - riskPenalty;
}
export function evaluateEvolution(proposal: EvolutionProposal, gates: Partial<Record<EvolutionGate, boolean>>): EvolutionEvaluation {
  const required: EvolutionGate[] = ["sandbox", "redTeam", "formal", "benchmark", "shadow", "approval"];
  const normalized = Object.fromEntries(required.map((g) => [g, gates[g] === true])) as Record<EvolutionGate, boolean>;
  const fitness = evolutionFitness(proposal.expectedGain, proposal.computeCost, proposal.riskPenalty);
  const accepted = required.every((g) => normalized[g]) && fitness > 0;
  return { proposal, gates: normalized, fitness, accepted, reason: accepted ? "all-gates-passed" : "fail-closed" };
}

export interface CausalEdge { from: string; to: string; effect: number; }
export interface CounterfactualGraph { nodes: string[]; edges: CausalEdge[]; }
export function counterfactual(graph: CounterfactualGraph, intervention: string, outcome: string): number {
  const direct = graph.edges.filter((e) => e.from === intervention && e.to === outcome).reduce((s, e) => s + e.effect, 0);
  return Math.max(-1, Math.min(1, direct));
}

export interface ReplayRecord<T> { id: string; input: T; output: T; loss: number; activity: number; recordedAt: string; }
export function offlineConsolidate<T>(records: ReplayRecord<T>[], replayLimit = 128, minActivity = 0.1): ReplayRecord<T>[] {
  return records.filter((r) => r.activity >= minActivity).sort((a, b) => b.loss - a.loss).slice(0, Math.max(0, replayLimit));
}
export function synapticPrune<T>(records: ReplayRecord<T>[], minActivity = 0.1): ReplayRecord<T>[] { return records.filter((r) => r.activity >= minActivity); }

export interface MetaLearningSignal { priorLoss: number; currentLoss: number; threshold: number; }
export function detectParadigmShift(signal: MetaLearningSignal): boolean {
  return signal.currentLoss - signal.priorLoss >= Math.max(0, signal.threshold);
}
export function mamlStep(lossGradient: number, stepSize = 0.01): number { return -lossGradient * stepSize; }

export interface Homeostasis { gain: number; computeCost: number; risk: number; maxCompute: number; maxRisk: number; }
export function homeostaticGate(x: Homeostasis): boolean { return x.computeCost <= x.maxCompute && x.risk <= x.maxRisk && x.gain > x.computeCost + x.risk; }

export interface RecursiveState { version: string; capabilities: string[]; rateLimits: Record<string, number>; errorRate: number; latencyMs: number; tools: string[]; snapshotAt: string; }
export function snapshotState(state: RecursiveState): RecursiveState { return JSON.parse(JSON.stringify(state)) as RecursiveState; }

export function semanticCacheKey(input: string): string { return createHash("sha256").update(input.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex"); }
export interface LatentMessage { vector: number[]; schema: string; checksum: string; }
export function latentMessage(vector: number[], schema = "v1"): LatentMessage { const body = vector.map((x) => Number(x.toFixed(6))); return { vector: body, schema, checksum: createHash("sha256").update(JSON.stringify({ body, schema })).digest("hex") }; }

export interface CrossExamination { verdict: "pass" | "fail"; objections: string[]; }
export function crossExamine(claim: string, checks: Array<(claim: string) => string | null>): CrossExamination {
  const objections = checks.map((c) => c(claim)).filter((x): x is string => Boolean(x));
  return { verdict: objections.length ? "fail" : "pass", objections };
}
export function constitutionalRefusal(operation: string, forbidden: string[]): boolean { return forbidden.some((x) => operation.includes(x)); }
export function temporalDecay(ageDays: number, halfLifeDays = 30): number { return halfLifeDays > 0 ? Math.pow(0.5, Math.max(0, ageDays) / halfLifeDays) : 0; }
export function donateCapacity(idle: number, requested: number): number { return Math.max(0, Math.min(idle, requested)); }
export function compressPrompt(input: string, budget: number): string { return [...new Set(input.split(/\s+/).filter(Boolean))].slice(0, Math.max(0, budget)).join(" "); }
export function hardNegativeWeight(loss: number, base = 1): number { return base * (1 + Math.max(0, loss)); }

export interface ModalityObservation { text?: string; voice?: string; structured?: Record<string, unknown>; imageEmbedding?: number[]; }
export function fuseModalities(observation: ModalityObservation): number { return [observation.text, observation.voice, observation.structured, observation.imageEmbedding].filter(Boolean).length / 4; }
export function loadShed<T extends { priority: number }>(items: T[], capacity: number): T[] { return [...items].sort((a, b) => b.priority - a.priority).slice(0, Math.max(0, capacity)); }
export interface DomainAdaptation { domain: string; safetyProfile: string; weightsChanged: false; }
export function adaptDomain(domain: string, safetyProfile: string): DomainAdaptation { return { domain, safetyProfile, weightsChanged: false }; }
export function handshake(supported: string[], requested: string): { accepted: boolean; protocol: string } { return { accepted: supported.includes(requested), protocol: requested }; }
export function chaosPlan(services: string[], target: string): { target: string; survivors: string[] } { return { target, survivors: services.filter((s) => s !== target) }; }

export interface ParetoPoint { latencyMs: number; costUsd: number; errorRate: number; }
export function paretoFront(points: ParetoPoint[]): ParetoPoint[] {
  return points.filter((p, i) => !points.some((q, j) => i !== j && q.latencyMs <= p.latencyMs && q.costUsd <= p.costUsd && q.errorRate <= p.errorRate && (q.latencyMs < p.latencyMs || q.costUsd < p.costUsd || q.errorRate < p.errorRate)));
}
export function boundedHorizonScore(reward: number, futureRisk: number, horizon = 12): number { return reward - futureRisk * Math.max(1, horizon); }
export function controlledNoise(value: number, seed: number, amplitude = 0.01): number { const x = Math.sin(seed * 12.9898) * 43758.5453; return value + (x - Math.floor(x) - 0.5) * 2 * amplitude; }
export function legacyBridge(protocol: string, payload: string): { protocol: string; payload: string; sourceOfTruth: "legacy" } { return { protocol, payload, sourceOfTruth: "legacy" }; }
export interface RetentionPolicy { frozenConcepts: string[]; trainableConcepts: string[]; }
export function pretrainedRetention(frozenConcepts: string[], trainableConcepts: string[]): RetentionPolicy { return { frozenConcepts: [...new Set(frozenConcepts)], trainableConcepts: [...new Set(trainableConcepts)] }; }
export function offlineFallback<T>(online: T | undefined, local: T): { mode: "online" | "offline"; value: T } { return online === undefined ? { mode: "offline", value: local } : { mode: "online", value: online }; }
export function curriculum(successRate: number, difficulty: number): number { return Math.max(0, difficulty + (successRate > 0.8 ? 1 : successRate < 0.5 ? -1 : 0)); }
export function defragmentMemory<T>(items: Array<{ key: string; value: T }>): T[] { return [...new Map(items.map((x) => [x.key, x.value])).values()]; }
export function alignSchema(input: Record<string, unknown>, aliases: Record<string, string>): Record<string, unknown> { return Object.fromEntries(Object.entries(input).map(([k, v]) => [aliases[k] ?? k, v])); }
export function switchModality(preferred: string, available: string[]): string { return available.includes(preferred) ? preferred : available[0] ?? "offline"; }
export function bayesianEvidence(baselineWins: number, baselineTrials: number, candidateWins: number, candidateTrials: number): number {
  const a = (baselineWins + 1) / (baselineTrials + 2); const b = (candidateWins + 1) / (candidateTrials + 2); return b - a;
}
export function trustDegrade(trust: number, failure: number): number { return Math.max(0, Math.min(1, trust - Math.max(0, failure))); }
export function fewShotToolPlan(goal: string, allowedOperations: string[]): { executable: false; goal: string; operations: string[] } { return { executable: false, goal, operations: [...allowedOperations] }; }
export function metaArchitecturePlan(objective: string, constraints: string[]): { objective: string; constraints: string[]; requiresApproval: true } { return { objective, constraints: [...constraints], requiresApproval: true }; }
export function schemaEnforce<T extends Record<string, unknown>>(input: T, required: string[]): { valid: boolean; missing: string[] } { const missing = required.filter((k) => input[k] === undefined || input[k] === null); return { valid: missing.length === 0, missing }; }
export function fuzzyClarify(text: string, candidates: string[]): string | undefined { const normalized = text.toLowerCase().trim(); return candidates.find((c) => c.toLowerCase().includes(normalized) || normalized.includes(c.toLowerCase())); }
export interface DagNode { id: string; dependsOn: string[]; }
export function dagOrder(nodes: DagNode[]): string[] { const pending = nodes.map((n) => ({ ...n, dependsOn: [...n.dependsOn] })); const out: string[] = []; while (pending.length) { const ready = pending.filter((n) => n.dependsOn.every((d) => out.includes(d))); if (!ready.length) return []; for (const n of ready) { out.push(n.id); pending.splice(pending.indexOf(n), 1); } } return out; }
export function clusterRoute(query: number[], centroids: number[][]): number { return centroids.map((c) => c.reduce((s, v, i) => s + Math.abs((query[i] ?? 0) - v), 0)).reduce((best, score, i, all) => score < all[best]! ? i : best, 0); }
export function auditReasoning(premises: string[], conclusion: string): { premises: string[]; conclusion: string; audited: true } { return { premises: [...premises], conclusion, audited: true }; }
export function knowledgeGraphMerge<T>(left: Map<string, T>, right: Map<string, T>): Map<string, T> { const merged = new Map(left); for (const [k, v] of right) merged.set(k, v); return merged; }

export interface GovernedRSIInput { state: RecursiveState; proposal: EvolutionProposal; gates: Partial<Record<EvolutionGate, boolean>>; }
export interface GovernedRSIResult { status: "release" | "rollback"; evaluation: EvolutionEvaluation; nextState: RecursiveState; }
export function governedRSI(input: GovernedRSIInput): GovernedRSIResult {
  const evaluation = evaluateEvolution(input.proposal, input.gates);
  const nextState = snapshotState(input.state);
  if (evaluation.accepted) nextState.version = input.proposal.id;
  return { status: evaluation.accepted ? "release" : "rollback", evaluation, nextState };
}
