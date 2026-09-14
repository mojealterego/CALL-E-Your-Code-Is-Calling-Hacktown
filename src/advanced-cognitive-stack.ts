import { createHash } from "node:crypto";

/**
 * Bounded, deterministic research abstractions. These names map research ideas
 * to explicit interfaces; they are not claims of training a JEPA/SNN/LLM or
 * reproducing proprietary systems.
 */

export type MemoryLayer = "working" | "episodic" | "procedural" | "semantic";
export interface CoALAMemory<T> { id: string; layer: MemoryLayer; content: T; validFrom: string; recordedAt: string; confidence: number; }
export class CoALAMemoryController<T> {
  private readonly memories: CoALAMemory<T>[] = [];
  constructor(private readonly maxEntries = 256) { if (maxEntries < 1) throw new Error("maxEntries must be positive"); }
  write(memory: CoALAMemory<T>): void {
    if (memory.confidence < 0 || memory.confidence > 1) throw new Error("confidence must be 0..1");
    this.memories.push(memory);
    if (this.memories.length > this.maxEntries) this.memories.shift();
  }
  read(layer?: MemoryLayer): CoALAMemory<T>[] { return this.memories.filter((m) => layer === undefined || m.layer === layer).map((m) => ({ ...m })); }
}

export interface GMemoryNode<T> { id: string; value: T; }
export interface GMemoryEdge { from: string; to: string; relation: string; weight: number; }
export class GMemory<T> {
  private readonly nodes = new Map<string, GMemoryNode<T>>();
  private readonly edges: GMemoryEdge[] = [];
  addNode(node: GMemoryNode<T>): void { this.nodes.set(node.id, { ...node }); }
  addEdge(edge: GMemoryEdge): void { if (edge.weight < 0 || edge.weight > 1) throw new Error("weight must be 0..1"); this.edges.push({ ...edge }); }
  neighbors(id: string): GMemoryNode<T>[] { const ids = this.edges.filter((e) => e.from === id).sort((a, b) => b.weight - a.weight).map((e) => e.to); return ids.flatMap((x) => { const n = this.nodes.get(x); return n ? [n] : []; }); }
  snapshot(): { nodes: GMemoryNode<T>[]; edges: GMemoryEdge[] } { return { nodes: [...this.nodes.values()].map((n) => ({ ...n })), edges: this.edges.map((e) => ({ ...e })) }; }
}

export type HDCVector = Uint8Array;
export function hdcEncode(text: string, dimensions = 256): HDCVector { if (dimensions < 32) throw new Error("dimensions must be >= 32"); const v = new Uint8Array(dimensions); const normalized = text.toLowerCase().replace(/\s+/g, " ").trim(); for (let i = 0; i < normalized.length; i++) { const h = hash(`${normalized[i]}:${i}`); const p = h % dimensions; v[p] ^= (h >>> 7) & 1; } return v; }
export function hdcSimilarity(a: HDCVector, b: HDCVector): number { if (a.length !== b.length) throw new Error("vector dimensions differ"); let same = 0; for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++; return same / a.length; }

export interface RagDocument<T> { id: string; text: string; value: T; recordedAt: string; }
export interface RagHit<T> extends RagDocument<T> { score: number; }
export class RAG2<T> {
  private readonly docs: RagDocument<T>[] = [];
  add(doc: RagDocument<T>): void { this.docs.push({ ...doc }); }
  retrieve(query: string, limit = 5, now = new Date().toISOString()): RagHit<T>[] {
    const q = tokens(query); return this.docs.map((d) => { const overlap = jaccard(q, tokens(d.text)); const age = Math.max(0, (Date.parse(now) - Date.parse(d.recordedAt)) / 86_400_000); return { ...d, score: overlap * Math.exp(-age / 30) }; }).sort((a, b) => b.score - a.score).slice(0, limit);
  }
  ground(query: string, limit = 5, now = new Date().toISOString()): RagHit<T>[] { return this.retrieve(query, limit, now).filter((x) => x.score > 0); }
}

export interface GoTNode { id: string; claim: string; score: number; }
export interface GoTEdge { from: string; to: string; relation: "supports" | "contradicts" | "depends"; }
export class GraphOfThought {
  private readonly nodes = new Map<string, GoTNode>(); private readonly edges: GoTEdge[] = [];
  addNode(node: GoTNode): void { this.nodes.set(node.id, { ...node }); }
  addEdge(edge: GoTEdge): void { this.edges.push({ ...edge }); }
  resolve(): GoTNode[] { const contradiction = new Set(this.edges.filter((e) => e.relation === "contradicts").map((e) => e.from)); return [...this.nodes.values()].filter((n) => !contradiction.has(n.id)).sort((a, b) => b.score - a.score); }
}

export interface Genotype { architecture: string[]; mutationRate: number; generation: number; }
export interface EvolutionCandidate { id: string; genotype: Genotype; fitness: number; computeCost: number; testsPassed: boolean; redTeamPassed: boolean; formalPassed: boolean; }
export function digitalGenotype(base: string[], generation = 0): Genotype { return { architecture: [...base], mutationRate: 0.1, generation }; }
export function mutateGenotype(parent: Genotype, mutation: string): Genotype { return { architecture: [...parent.architecture, mutation], mutationRate: parent.mutationRate, generation: parent.generation + 1 }; }
export function alphaEvolve(parent: EvolutionCandidate, mutation: string, measuredFitness: number, computeCost: number, gates: { sandbox: boolean; redTeam: boolean; formal: boolean }): EvolutionCandidate { const genotype = mutateGenotype(parent.genotype, mutation); return { id: `${parent.id}-g${genotype.generation}`, genotype, fitness: measuredFitness, computeCost, testsPassed: gates.sandbox, redTeamPassed: gates.redTeam, formalPassed: gates.formal }; }
export function selectEvolution(candidates: EvolutionCandidate[]): EvolutionCandidate | undefined { return candidates.filter((c) => c.testsPassed && c.redTeamPassed && c.formalPassed && c.fitness > 0).sort((a, b) => (b.fitness - a.fitness) || (a.computeCost - b.computeCost))[0]; }

export type RSIStage = "observe" | "profile" | "hypothesis" | "generate" | "sandbox" | "red-team" | "formal" | "benchmark" | "shadow" | "approval" | "release" | "rollback";
export interface RSIState { stage: RSIStage; version: string; changeId: string; approved: boolean; }
const rsiOrder: RSIStage[] = ["observe", "profile", "hypothesis", "generate", "sandbox", "red-team", "formal", "benchmark", "shadow", "approval", "release", "rollback"];
export function advanceRSI(state: RSIState, gates: { sandbox?: boolean; redTeam?: boolean; formal?: boolean; benchmark?: boolean; approved?: boolean }): RSIState { if (state.stage === "release") return state; if (state.stage === "sandbox" && !gates.sandbox) return { ...state, stage: "rollback" }; if (state.stage === "red-team" && !gates.redTeam) return { ...state, stage: "rollback" }; if (state.stage === "formal" && !gates.formal) return { ...state, stage: "rollback" }; if (state.stage === "benchmark" && !gates.benchmark) return { ...state, stage: "rollback" }; if (state.stage === "approval" && !gates.approved) return { ...state, stage: "rollback" }; const i = rsiOrder.indexOf(state.stage); return { ...state, stage: rsiOrder[Math.min(i + 1, rsiOrder.length - 1)] ?? "rollback" }; }

export interface SNNSpike { t: number; neuron: number; amplitude: number; }
export function snnEncode(values: number[], threshold = 0.5): SNNSpike[] { if (threshold <= 0) throw new Error("threshold must be positive"); return values.map((v, i) => ({ t: i, neuron: i, amplitude: v })).filter((s) => s.amplitude >= threshold); }

export interface JEPAPrediction { contextHash: string; predicted: string; error: number; }
export function jepaPredict(context: string, target: string): JEPAPrediction { const a = tokens(context); const b = tokens(target); const error = 1 - jaccard(a, b); return { contextHash: hash(context), predicted: [...a].join(" "), error }; }

export interface DecisionOption { id: string; utility: number; risk: number; cost: number; }
export function abMcts(options: DecisionOption[], simulations = 32): DecisionOption | undefined { if (simulations < 1) throw new Error("simulations must be positive"); return [...options].sort((a, b) => (b.utility - b.risk - b.cost) - (a.utility - a.risk - a.cost))[0]; }
export function counterfactualScore(baseline: DecisionOption, alternative: DecisionOption): number { return (alternative.utility - alternative.risk - alternative.cost) - (baseline.utility - baseline.risk - baseline.cost); }

export interface ConstitutionalRule { id: string; predicate: (input: unknown) => boolean; }
export function constitutionalEvaluate(input: unknown, rules: ConstitutionalRule[]): { allowed: boolean; failed: string[] } { const failed = rules.filter((r) => !r.predicate(input)).map((r) => r.id); return { allowed: failed.length === 0, failed }; }
export function antiRewardHacking(gain: number, computeCost: number, riskPenalty: number): number { return gain - computeCost - riskPenalty; }

export interface FormalInvariant { id: string; check: (state: unknown) => boolean; }
export function godelGuard(state: unknown, invariants: FormalInvariant[]): boolean { return invariants.every((i) => i.check(state)); }
export const imandraXGuard = godelGuard;
export const SEGPA = godelGuard;
export function OESI(evidence: { present: boolean; confidence: "low" | "medium" | "high"; contradiction: boolean }): boolean { return evidence.present && evidence.confidence === "high" && !evidence.contradiction; }
export function CEV(input: unknown, rules: ConstitutionalRule[]): boolean { return constitutionalEvaluate(input, rules).allowed; }
export function adversarialGate(input: unknown, attacks: Array<(x: unknown) => boolean>): boolean { return attacks.every((attack) => !attack(input)); }

export interface AgentDevelopmentResult { candidate: EvolutionCandidate; counterfactualSafe: boolean; constitutionalSafe: boolean; }
export function agentDevel(candidate: EvolutionCandidate, counterfactualSafe: boolean, constitutionalSafe: boolean): AgentDevelopmentResult { return { candidate, counterfactualSafe, constitutionalSafe }; }

export interface ReplayItem<T> { id: string; observation: T; outcome: T; difficulty: number; }
export function offlineReplay<T>(items: ReplayItem<T>[], limit = 100): ReplayItem<T>[] { return [...items].sort((a, b) => b.difficulty - a.difficulty).slice(0, limit); }
export function synapticPrune<T>(items: Array<{ value: T; activity: number }>, minActivity: number): T[] { return items.filter((x) => x.activity >= minActivity).map((x) => x.value); }

export function abTest<T>(baseline: T, candidate: T, metric: (x: T) => number): { winner: "baseline" | "candidate" | "tie"; baselineScore: number; candidateScore: number } { const a = metric(baseline); const b = metric(candidate); return { winner: b > a ? "candidate" : a > b ? "baseline" : "tie", baselineScore: a, candidateScore: b }; }
export function schemaAlign(input: Record<string, unknown>, aliases: Record<string, string>): Record<string, unknown> { return Object.fromEntries(Object.entries(input).map(([k, v]) => [aliases[k] ?? k, v])); }
export function modalitySwitch(preferred: "text" | "voice" | "structured", available: Array<"text" | "voice" | "structured">): "text" | "voice" | "structured" | "offline" { return available.includes(preferred) ? preferred : available[0] ?? "offline"; }
export function trustGate(trust: number, minimum: number): boolean { return trust >= minimum; }
export function semanticCacheKey(input: string): string { return hash(input.toLowerCase().replace(/\s+/g, " ").trim()); }
export function resourceDonate(idleCapacity: number, requestedCapacity: number): number { return Math.max(0, Math.min(idleCapacity, requestedCapacity)); }
export function dynamicLoadShedding<T extends { priority: number }>(items: T[], capacity: number): T[] { return [...items].sort((a, b) => b.priority - a.priority).slice(0, Math.max(0, capacity)); }
export function promptPrune(tokensInput: string[], budget: number): string[] { return [...new Set(tokensInput.filter(Boolean))].slice(0, Math.max(0, budget)); }
export function curriculumDifficulty(successRate: number, current: number): number { return Math.max(0, current + (successRate > 0.8 ? 1 : successRate < 0.5 ? -1 : 0)); }
export function temporalKnowledgeWeight(ageDays: number, halfLifeDays = 30): number { return Math.pow(0.5, Math.max(0, ageDays) / halfLifeDays); }

export interface DigitalNexusState { version: string; capabilities: string[]; trust: number; memoryLayers: MemoryLayer[]; }
export class DigitalNexusCore {
  private state: DigitalNexusState;
  constructor(initial: DigitalNexusState) { this.state = { ...initial, capabilities: [...initial.capabilities], memoryLayers: [...initial.memoryLayers] }; }
  introspect(): DigitalNexusState { return { ...this.state, capabilities: [...this.state.capabilities], memoryLayers: [...this.state.memoryLayers] }; }
  modulate(delta: { trust?: number; addCapability?: string }): void { if (delta.trust !== undefined) this.state.trust = Math.max(0, Math.min(1, delta.trust)); if (delta.addCapability && !this.state.capabilities.includes(delta.addCapability)) this.state.capabilities.push(delta.addCapability); }
}
export function cognitiveModulation(signal: number, gain: number, floor = 0): number { return Math.max(floor, signal * gain); }

export interface GCPPolicy { allow: (operation: string) => boolean; }
export class GovernedCognitivePlane { constructor(private readonly policy: GCPPolicy) {} authorize(operation: string): boolean { return this.policy.allow(operation); } }

function tokens(text: string): Set<string> { return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)); }
function jaccard(a: Set<string>, b: Set<string>): number { const i = [...a].filter((x) => b.has(x)).length; const u = new Set([...a, ...b]).size; return u ? i / u : 0; }
function hash(value: string): string { return createHash("sha256").update(value).digest("hex").slice(0, 32); }
