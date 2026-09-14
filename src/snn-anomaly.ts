export interface EventSample {
  timestampMs: number;
  value: number;
}

export interface SNNAnomalyResult {
  spikes: number[];
  anomalyScore: number;
  anomalous: boolean;
  reason: string;
}

/**
 * Deterministic LIF-inspired temporal sensor. It is deliberately outside the
 * reasoning and authorization path: it can raise a signal, never authorize a
 * transaction.
 */
export function detectTemporalAnomaly(events: EventSample[], threshold = 0.8): SNNAnomalyResult {
  if (events.length < 2) return { spikes: [], anomalyScore: 0, anomalous: false, reason: "Insufficient event history." };
  const intervals = events.slice(1).map((event, index) => event.timestampMs - (events[index]?.timestampMs ?? event.timestampMs));
  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance = intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length;
  const std = Math.sqrt(variance);
  const spikes = intervals.map((interval) => std === 0 ? 0 : Math.abs(interval - mean) / std >= 2 ? 1 : 0);
  const anomalyScore = spikes.length ? spikes.reduce((sum, spike) => sum + spike, 0) / spikes.length : 0;
  return {
    spikes,
    anomalyScore,
    anomalous: anomalyScore >= threshold,
    reason: anomalyScore >= threshold ? "Temporal event stream is anomalous." : "Temporal event stream is within the observed pattern.",
  };
}

export function anomalyRequiresRecovery(result: SNNAnomalyResult): boolean { return result.anomalous; }
