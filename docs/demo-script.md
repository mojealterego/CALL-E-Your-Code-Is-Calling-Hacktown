# 3-Minute Judge Demo Script

## 0:00–0:25 — The problem

Show a dashboard/terminal with an A4 closure incident. Say: "A road closure turns a logistics decision into a phone-work problem. A dispatcher should not have to make dozens of calls just to restore the plan."

## 0:25–0:55 — Safety gate

Run `npm run verify:final`. The command runs the complete automated test suite, TypeScript typecheck, and deterministic dry-run demo. Point out that the application validates the purpose, creates an operation identity, and stays in DRY-RUN mode. Emphasize: no phone call is possible in the default path.

## 0:55–1:35 — Autonomous phone task boundary

Show the architecture: incident → policy → idempotency → CALL-E adapter → structured outcome → evidence gate → audit/reflexion memory. Explain that CALL-E is responsible for phone execution while AegisFleet owns the operational decision policy.

## 1:35–2:10 — Structured result

Show the JSON output. Highlight `route_acceptance`, `eta_update_time`, `escalation_needed`, `evidence_summary`, and `confidence`. Explain that `unknown` is a durable state, not an implicit `no`, and that unexpected fields are rejected by runtime validation.

## 2:10–2:35 — Resilience

Point to the idempotency, Reflexion, bitemporal-memory and synthetic-red-team tests. Explain that re-submitting the same incident reuses the logical operation rather than creating a second call identity, while uncertain or adversarial outcomes remain escalated.

## 2:35–3:00 — Impact

Close with: "AegisFleet is a control plane for phone-based operations. It does not ask an AI to 'sound smart'; it asks the system to make one bounded real-world decision, with evidence, uncertainty and human escalation built into the boundary."

## Live recording note

For a real CALL-E recording, replace the dry-run command with the explicitly configured live path and use a provisioned test recipient. Never place a real call to a person who has not been authorized for the demonstration. A successful phone connection is not a successful incident resolution unless the structured outcome passes every resolution gate.
