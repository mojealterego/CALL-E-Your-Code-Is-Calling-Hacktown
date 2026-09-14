export interface EventSample { timestampMs: number; value: number; }
export interface SNNAnomalyResult { spikes: number[]; anomalyScore: number; anomalous: boolean; reason: string; }

/** Deterministic LIF-inspired temporal sensor. It can raise recovery, never authorize execution. */
export function detectTemporalAnomaly(events: EventSample[], threshold = 0.8): SNNAnomalyResult {
  if (events.length < 2) return { spikes: [], anomalyScore: 0, anomalous: false, reason: "Insufficient event history." };
  const intervals = events.slice(1).map((event, index) => event.timestampMs - (events[index]?.timestampMs ?? event.timestampMs));
  const ordered = [...intervals].sort((a, b) => a - b);
  const median = ordered[Math.floor(ordered.length / 2)] ?? 0;
  if (median <= 0) return { spikes: [], anomalyScore: 0, anomalous: false, reason: "Temporal intervals are invalid or zero-length." };
  const spikes: number[] = intervals.map((interval) => interval >= median * 3 || interval <= median / 3 ? 1 : 0);
  const anomalyScore = spikes.reduce((sum: number, spike: number) => sum + spike, 0) / spikes.length;
  return { spikes, anomalyScore, anomalous: anomalyScore >= threshold, reason: anomalyScore >= threshold ? "Temporal event stream is anomalous." : "Temporal event stream is within the observed pattern." };
}

export function anomalyRequiresRecovery(result: SNNAnomalyResult): boolean { return result.anomalous; }
