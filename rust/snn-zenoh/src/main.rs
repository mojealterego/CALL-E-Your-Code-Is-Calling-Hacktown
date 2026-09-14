use aegisfleet_snn_zenoh::{SnnEngine, DEFAULT_BUDGET};

fn main() {
    let mut engine = SnnEngine::new(8, 0.5, 0.9, DEFAULT_BUDGET);
    let (frame, budget) = engine.step(&[0.6, 0.1, 0.8, 0.0, 0.7, 0.2, 0.9, 0.4]);
    println!("sequence={} spikes={} elapsed_us={} budget_us={} within_budget={}", frame.sequence, frame.spikes.len(), budget.elapsed_us, budget.budget_us, budget.within_budget);
}
