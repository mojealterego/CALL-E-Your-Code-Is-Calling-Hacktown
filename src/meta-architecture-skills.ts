/** Bounded operating-skill contracts for Meta-Architecture capabilities. Pure policy/data functions only. */

export interface NegotiationOption { id: string; value: number; cost: number; risk: number; }
export interface NegotiationResult { preferred: string | undefined; batna: string | undefined; rationale: string[]; }
export function negotiate(options: NegotiationOption[], batnaId?: string): NegotiationResult { const ranked = [...options].sort((a, b) => (b.value - b.cost - b.risk) - (a.value - a.cost - a.risk)); const batna = options.find((x) => x.id === batnaId); return { preferred: ranked[0]?.id, batna: batna?.id, rationale: ranked[0] ? [`maximize value-cost-risk`, batna ? `BATNA:${batna.id}` : "no explicit BATNA"] : [] }; }

export interface TCO { infrastructure: number; api: number; security: number; tuning: number; team: number; }
export function totalCostOfOwnership(tco: TCO): number { return Object.values(tco).reduce((a, b) => a + b, 0); }
export function accuracyCostCurve(points: Array<{ accuracy: number; cost: number }>): Array<{ accuracy: number; cost: number }> { return [...points].sort((a, b) => a.accuracy - b.accuracy); }

export interface DriftSignal { score: number; threshold: number; drift: boolean; }
export function conceptDrift(score: number, threshold: number): DriftSignal { return { score, threshold, drift: score > threshold }; }
export function cosineSimilarity(a: number[], b: number[]): number { if (a.length !== b.length || !a.length) throw new Error("vectors must have equal non-zero dimensions"); let dot = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { dot += a[i]! * b[i]!; na += a[i]! ** 2; nb += b[i]! ** 2; } return na && nb ? dot / Math.sqrt(na * nb) : 0; }

export interface ShadowComparison { baseline: number; candidate: number; delta: number; winner: "baseline" | "candidate" | "tie"; }
export function shadowCompare(baseline: number, candidate: number): ShadowComparison { return { baseline, candidate, delta: candidate - baseline, winner: candidate > baseline ? "candidate" : candidate < baseline ? "baseline" : "tie" }; }
export function explorationChoice<T>(stable: T, experimental: T, randomUnit: number, epsilon = 0.05): { choice: T; exploratory: boolean } { if (epsilon < 0 || epsilon > 1 || randomUnit < 0 || randomUnit > 1) throw new Error("invalid exploration inputs"); const exploratory = randomUnit < epsilon; return { choice: exploratory ? experimental : stable, exploratory }; }

export interface DelegationContract { inputSchema: string; outputSchema: string; latencyMs: number; auditRequired: boolean; }
export function validateDelegationContract(contract: DelegationContract): boolean { return Boolean(contract.inputSchema && contract.outputSchema && contract.latencyMs > 0 && contract.auditRequired); }
export interface SquadRole { role: string; capability: string; }
export function composeSquad(roles: SquadRole[]): SquadRole[] { return [...new Map(roles.map((r) => [`${r.role}:${r.capability}`, r])).values()]; }

export interface AttentionContext { recent: string[]; summary: string; tokenBudget: number; }
export function optimizeContext(history: string[], tokenBudget: number, keepRecent = 3): AttentionContext { if (tokenBudget < 1) throw new Error("tokenBudget must be positive"); const recent = history.slice(-Math.max(0, keepRecent)); const older = history.slice(0, Math.max(0, history.length - recent.length)); const summary = older.join(" ").slice(0, tokenBudget); return { recent, summary, tokenBudget }; }
export function strictRequiredFields(input: Record<string, unknown>, required: string[]): { valid: boolean; missing: string[] } { const missing = required.filter((key) => input[key] === undefined || input[key] === null); return { valid: missing.length === 0, missing }; }

export function jitteredBackoff(attempt: number, baseMs = 100, capMs = 10_000, jitter = 0.2): number { if (attempt < 0 || baseMs <= 0 || capMs <= 0 || jitter < 0 || jitter > 1) throw new Error("invalid backoff inputs"); const raw = Math.min(capMs, baseMs * 2 ** attempt); return Math.round(raw * (1 - jitter / 2)); }
export function timeoutDecision(elapsedMs: number, budgetMs: number, partialResult: unknown): { complete: boolean; result: unknown } { return { complete: elapsedMs <= budgetMs, result: partialResult }; }

export interface FailureMemory<T> { fingerprint: string; prompt: string; error: T; count: number; }
export class FailureMemoryStore<T> { private readonly entries = new Map<string, FailureMemory<T>>(); record(item: FailureMemory<T>): void { this.entries.set(item.fingerprint, { ...item }); } find(fingerprint: string): FailureMemory<T> | undefined { const item = this.entries.get(fingerprint); return item ? { ...item } : undefined; } size(): number { return this.entries.size; } }
export function asyncBatches<T>(items: T[], concurrency: number): T[][] { if (concurrency < 1) throw new Error("concurrency must be positive"); const out: T[][] = []; for (let i = 0; i < items.length; i += concurrency) out.push(items.slice(i, i + concurrency)); return out; }

export interface GoalScore { reward: number; hallucinationPenalty: number; computeCost: number; riskPenalty: number; }
export function globalReward(score: GoalScore): number { return score.reward - score.hallucinationPenalty - score.computeCost - score.riskPenalty; }
export interface PreferenceSignal { positive: number; negative: number; }
export function preferencePenalty(signal: PreferenceSignal): number { return signal.positive - signal.negative; }
export function heuristicFastPath(spamScore: number, threshold = 0.9): "reject" | "delegate" { return spamScore >= threshold ? "reject" : "delegate"; }
export function uncertaintyFallback(confidence: number, threshold = 0.98): "human" | "autonomous" { return confidence < threshold ? "human" : "autonomous"; }

export interface ServiceDescriptor { name: string; version: string; capabilities: string[]; }
export class ServiceRegistry { private readonly services = new Map<string, ServiceDescriptor>(); register(service: ServiceDescriptor): void { this.services.set(service.name, { ...service, capabilities: [...service.capabilities] }); } discover(capability: string): ServiceDescriptor[] { return [...this.services.values()].filter((s) => s.capabilities.includes(capability)).map((s) => ({ ...s, capabilities: [...s.capabilities] })); } }
export interface LongRunningJob { id: string; status: "pending" | "complete" | "failed"; result?: unknown; }
export function handleWebhook(job: LongRunningJob, eventId: string, seen: Set<string>): { accepted: boolean; job: LongRunningJob } { if (seen.has(eventId)) return { accepted: false, job }; seen.add(eventId); return { accepted: true, job: { ...job } }; }

export function postmortem(failure: string, processGap: string, owner?: string): { failure: string; processGap: string; owner?: string; blameFree: true } { return { failure, processGap, ...(owner ? { owner } : {}), blameFree: true }; }
export function privacyArchitecture(dataClasses: string[], allowed: string[]): { retained: string[]; blocked: string[] } { return { retained: dataClasses.filter((x) => allowed.includes(x)), blocked: dataClasses.filter((x) => !allowed.includes(x)) }; }
export function conflictDecision<T>(options: T[], score: (option: T) => number): T | undefined { return [...options].sort((a, b) => score(b) - score(a))[0]; }
export function techRadar<T>(items: T[], rank: (item: T) => number): T[] { return [...items].sort((a, b) => rank(b) - rank(a)); }
