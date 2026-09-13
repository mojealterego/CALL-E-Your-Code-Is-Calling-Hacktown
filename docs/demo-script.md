# 3-Minute Judge Demo Script

## 0:00–0:15 — The problem

Show the A4 closure incident.

Say:

> "The hard part is not making an AI phone call. The hard part is deciding whether a phone conversation is enough evidence to change a real operational state."

## 0:15–0:35 — PREPARE

Show:

```text
Transaction: TX-AF-DEMO-0001
Proposed route: B
Maximum ETA: 19:00
Participant: TRUCK-42
```

Say:

> "AegisFleet freezes the exact operational intent before the phone call. This is the state we are prepared to commit — not whatever the agent happens to negotiate."

## 0:35–1:15 — CALL-E

Run the explicitly configured live path with an authorized test recipient.

Show the CALL-E call ID and the terminal result.

Say:

> "CALL-E owns the phone interaction. AegisFleet does not give the voice agent authority to change the business state."

## 1:15–1:35 — EVIDENCE

Show:

```text
route: B
acceptance: yes
ETA: 18:40
confidence: high
task_completed: true
```

Point out that terminal completion and evidence are separate from the structured business decision.

## 1:35–1:50 — RECONCILE → COMMIT

Show:

```text
prepared route B == observed route B
18:40 <= 19:00
acceptance = yes
confidence = high
task_completed = true

DECISION: COMMIT
```

Say:

> "Only now is the operational state allowed to change."

## 1:50–2:15 — CONFLICT → ABORT

Run the deterministic conflict fixture or show the test.

```text
prepared route: B
observed route: C

DECISION: ABORT
reason: observed route does not match prepared route
```

Say:

> "The driver can answer the phone and still disagree with the prepared transaction. The system refuses to commit."

## 2:15–2:35 — UNKNOWN → RECOVER

Show an incomplete or uncertain result.

```text
acceptance: unknown
route: unknown
CALL-E terminal evidence: incomplete

DECISION: RECOVER
```

Say:

> "Unknown is not success and it is not permission to make another call blindly. Recovery first reconciles the existing call."

## 2:35–2:50 — AUDIT

Show the transaction receipt and hash-linked audit digest.

Point to:

- transaction ID;
- CALL-E call ID;
- decision;
- evidence;
- previous audit digest;
- current audit digest.

## 2:50–3:00 — Closing line

Say:

> "CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change."

## Recording safety

- Use only an authorized test recipient.
- Keep `CALLE_API_KEY` out of the recording and repository.
- Use `CALL_E_MODE=live` only for the intended live demonstration.
- The default `npm run demo` path remains provider-free and makes no phone call.
