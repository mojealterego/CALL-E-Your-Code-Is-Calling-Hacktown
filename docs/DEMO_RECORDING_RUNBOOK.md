# AegisFleet — final demo recording runbook

## Purpose

Record the hackathon demo before any further live CALL-E test. **Do not place another live call while preparing the recording.**

Target duration: **under 3 minutes**.

## Recording order

### 0:00–0:20 — Problem

Say:

> AI agents can speak, but speaking is not accountability. AegisFleet is the assurance layer between an agent's intent and a real-world phone transaction.

### 0:20–0:50 — Prepared transaction

Show the repository and the appointment scenario:

- Przychodnia Medica Nova
- Anna, receptionist
- Adam Miauczyński
- doktor Pawlak
- tomorrow's appointment: 15 September 2026, 10:00
- prepared replacement slots only

Do not expose secrets or the recipient phone number.

### 0:50–1:35 — Deterministic safety demo

Run:

```bash
npm run demo
```

Point out:

- `mode=DRY-RUN`
- policy / assurance decision
- transaction receipt
- audit digest
- `callsPlaced: 0`
- `DRY-RUN GUARANTEE: no provider request and no phone call were made.`

This is the safe part of the recording and must remain provider-free.

### 1:35–2:15 — Explain the live gate

Show `.github/workflows/live-call.yml` and explain that live execution is deliberately separated from the deterministic demo.

Highlight:

- explicit workflow dispatch
- explicit one-call authorization
- production CALL-E endpoint
- `CALLE_API_KEY` and `AEGIS_LIVE_PHONE` are repository secrets
- E.164 phone validation
- unique `AEGIS_LIVE_TEST_ID` per workflow run
- tests and typecheck before live execution
- `callId` required
- unresolved live transaction causes a failed workflow, never a false green result

Do not click **Run workflow** during this recording segment.

### 2:15–2:50 — Assurance conclusion

Say:

> The important part is not that AegisFleet can make a phone call. The important part is that the system can prove what it was allowed to do, what the provider returned, what evidence was accepted, and whether the transaction was safe to commit.

Then show the final repository tree / README and stop.

## Optional live-call footage

If a real CALL-E call is later needed for the final submission, record it as a **separate controlled take** after the code and CI are verified. Do not mix the live-call authorization step into the deterministic demo recording.

## Recording rules

- Never show API keys, GitHub secrets, or private credentials.
- Never show the recipient phone number.
- Do not claim a live call happened unless the run produced a real CALL-E `callId`.
- Do not claim a live call succeeded merely because GitHub is green.
- Do not use a live call as the proof of deterministic safety; the demo is intentionally provider-free.
- Keep the final video below 3 minutes.
