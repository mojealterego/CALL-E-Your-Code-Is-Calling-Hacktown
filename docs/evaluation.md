# Evaluation Plan

## Core hypothesis

Governed phone automation can reduce incident-to-decision latency without increasing false operational resolutions.

## Evaluation matrix

| Test | Input | Pass condition |
|---|---|---|
| Valid incident | Correctly formed route/ETA task | Reaches `resolved` in dry-run |
| Bad phone | Invalid/non-E.164 number | Reaches `escalated`; no provider I/O |
| Fixture phone in live | Example/555 number | Rejected before provider I/O |
| Ambiguous answer | `unknown` route acceptance | Escalates |
| Low confidence | confidence != `high` | Escalates |
| Duplicate submission | Same incident twice | One logical ledger record |
| Reflexion persistence | Non-reused execution | One episodic bitemporal finding is stored |
| Reflexion reuse | Same terminal operation twice | No duplicate retrospective finding |
| Bitemporal reconstruction | Multiple versions with different valid/recorded times | Point-in-time query returns the historically visible state |
| Malformed webhook | Missing event fields | Rejected |
| Replayed webhook | Same event ID twice | First accepted, second ignored |
| Missing live credential | Live mode without key | Fails closed |
| Synthetic red-team | Adversarial safety cases | No case permits an unsafe automatic resolution |

## Safety invariants

1. **Policy is authoritative:** a policy rejection cannot be converted into a successful execution by Reflexion or memory.
2. **Evidence is mandatory:** missing or invalid evidence cannot produce automatic resolution.
3. **Confidence is explicit:** low or unknown confidence escalates rather than being treated as success.
4. **Idempotency precedes provider I/O:** duplicate operations must not create duplicate terminal work.
5. **Retrospective memory is non-authoritative:** Reflexion findings are stored for learning/audit but cannot authorize resolution.
6. **Live mode fails closed:** missing or invalid live configuration stops execution before provider I/O.
7. **Replay safety:** repeated webhook events cannot mutate the outcome twice.
8. **Red-team safety:** every deterministic adversarial scenario must preserve escalation safety.

## Prototype evidence vs production measurement

The current repository provides deterministic unit/integration tests and a synthetic red-team harness. **No production latency, cost, precision, recall or reliability figures are claimed.** Those values require a controlled pilot with real traffic, explicit sampling methodology and failure injection.

## Production pilot metrics

1. **Incident-to-disposition latency:** elapsed time from accepted incident to resolved/escalated terminal state.
2. **Human minutes per incident:** operator time spent after escalation or override.
3. **Automatic resolution precision:** resolved incidents that were actually sufficiently evidenced and operationally correct divided by all automatic resolutions.
4. **Escalation recall:** correctly escalated ambiguous/failed incidents divided by all incidents that should have escalated.
5. **False-resolution rate:** incidents automatically marked resolved despite insufficient evidence or an incorrect operational state. Target: **0 in the validation cohort**.
6. **Duplicate-call incidence:** duplicate provider executions per 1,000 incident operations under retry/failure injection.
7. **Structured-result validity rate:** provider/simulator results passing the strict schema contract divided by all returned results.
8. **Operator override rate:** automatic resolutions later changed by a human operator.
9. **Red-team pass rate:** adversarial cases that preserve all safety invariants divided by total cases.
10. **Point-in-time replay correctness:** historical queries returning the expected state for a specified valid-time and recording-time cutoff.

## Evaluation principle

The primary optimization target is not call completion. It is **safe disposition**: minimize incident-to-decision latency and operational cost subject to zero tolerated false resolutions in the validation cohort, explicit escalation for uncertainty, and auditable evidence for every automatic resolution.
