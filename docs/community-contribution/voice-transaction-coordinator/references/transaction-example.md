# Transaction Example

A generic appointment rescheduling flow illustrates the boundary without depending on a specific provider.

## Prepared state

```json
{
  "transaction_id": "appt-123",
  "participant": "customer",
  "requested_action": "reschedule",
  "allowed_dates": ["2026-09-15", "2026-09-16"],
  "allowed_slots": ["09:30", "11:00", "14:00"]
}
```

## During the call

- Establish identity before disclosing protected appointment details.
- Explain the bounded purpose of the call.
- Accept only dates and times contained in the prepared availability.
- Clarify ambiguous answers.
- If the participant declines, stop rather than repeatedly pushing alternatives.

## Reconciliation

Commit only if the terminal provider evidence confirms the exact requested appointment change and all prepared constraints still hold.

If the participant proposes a value outside the prepared set, do not invent availability. Return `RECOVER` or obtain an updated prepared state through the host application's authorized workflow.

If the call disconnects before authoritative terminal evidence exists, do not commit. Recovery may re-fetch the existing call state; it must not blindly place a duplicate call.
