use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

pub const DEFAULT_BUDGET: Duration = Duration::from_millis(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Spike {
    pub neuron: usize,
    pub time_us: u64,
    pub amplitude: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct LIFNeuron {
    pub membrane: f32,
    pub threshold: f32,
    pub leak: f32,
}

impl LIFNeuron {
    pub fn step(&mut self, input: f32, neuron: usize, time_us: u64) -> Option<Spike> {
        self.membrane = self.membrane * self.leak + input;
        if self.membrane >= self.threshold {
            let amplitude = self.membrane;
            self.membrane = 0.0;
            Some(Spike { neuron, time_us, amplitude })
        } else {
            None
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnnFrame {
    pub sequence: u64,
    pub timestamp_us: u64,
    pub spikes: Vec<Spike>,
    pub budget_ms: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BudgetStatus {
    pub within_budget: bool,
    pub elapsed_us: u128,
    pub budget_us: u128,
}

pub struct SnnEngine {
    neurons: Vec<LIFNeuron>,
    sequence: u64,
    budget: Duration,
}

impl SnnEngine {
    pub fn new(neuron_count: usize, threshold: f32, leak: f32, budget: Duration) -> Self {
        assert!(neuron_count > 0, "neuron_count must be positive");
        assert!(threshold > 0.0, "threshold must be positive");
        assert!((0.0..=1.0).contains(&leak), "leak must be in 0..=1");
        Self {
            neurons: (0..neuron_count).map(|_| LIFNeuron { membrane: 0.0, threshold, leak }).collect(),
            sequence: 0,
            budget,
        }
    }

    pub fn step(&mut self, inputs: &[f32]) -> (SnnFrame, BudgetStatus) {
        let started = Instant::now();
        let timestamp_us = started.elapsed().as_micros() as u64;
        let mut spikes = Vec::new();
        for (i, neuron) in self.neurons.iter_mut().enumerate() {
            if let Some(spike) = neuron.step(inputs.get(i).copied().unwrap_or(0.0), i, timestamp_us) {
                spikes.push(spike);
            }
        }
        self.sequence += 1;
        let elapsed = started.elapsed();
        let status = BudgetStatus {
            within_budget: elapsed <= self.budget,
            elapsed_us: elapsed.as_micros(),
            budget_us: self.budget.as_micros(),
        };
        (SnnFrame { sequence: self.sequence, timestamp_us, spikes, budget_ms: self.budget.as_millis() as u64 }, status)
    }

    pub fn budget(&self) -> Duration { self.budget }
    pub fn sequence(&self) -> u64 { self.sequence }
}

#[cfg(feature = "zenoh-transport")]
pub async fn publish_frame(session: &zenoh::Session, key: &str, frame: &SnnFrame) -> zenoh::Result<()> {
    let publisher = session.declare_publisher(key).await?;
    let payload = serde_json::to_vec(frame).expect("SNN frame is serializable");
    publisher.put(payload).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lif_neuron_emits_and_resets() {
        let mut n = LIFNeuron { membrane: 0.0, threshold: 1.0, leak: 0.5 };
        assert!(n.step(1.1, 0, 10).is_some());
        assert_eq!(n.membrane, 0.0);
    }

    #[test]
    fn engine_has_explicit_one_ms_budget() {
        let mut engine = SnnEngine::new(8, 0.5, 0.9, DEFAULT_BUDGET);
        let (frame, status) = engine.step(&[0.6; 8]);
        assert_eq!(frame.budget_ms, 1);
        assert_eq!(status.budget_us, 1_000);
        assert_eq!(frame.sequence, 1);
    }
}
