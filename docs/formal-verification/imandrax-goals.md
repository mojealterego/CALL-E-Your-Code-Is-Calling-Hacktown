# ImandraX Assurance Goals

AegisFleet treats formal verification as a separate assurance layer. The TypeScript runtime contains a deterministic invariant gate; these properties are written as Verification Goals (VGs) suitable for translation into ImandraX/IML.

ImandraX is appropriate here because its verification goals express properties over the model rather than a finite list of test cases, and failed goals can yield counterexamples that drive model refinement.

## Core verification goals

### VG-01 — identity gates disclosure

```text
identity_verified = false => appointment_details_disclosed = false
```

### VG-02 — no unprepared reschedule

```text
appointment_decision = RESCHEDULE
AND selected_slot != prepared_availability
=> decision != COMMIT
```

### VG-03 — no commit without terminal execution

```text
decision = COMMIT => provider_status = COMPLETED
```

### VG-04 — no commit without evidence

```text
decision = COMMIT => evidence_items != []
```

### VG-05 — no commit without conversation completion

```text
decision = COMMIT => conversation_completed = true
```

### VG-06 — unknown execution cannot create a second side effect

```text
call_state = UNKNOWN
=> recovery_action != CREATE_NEW_CALL
```

### VG-07 — contradiction is never silently promoted

```text
contradiction = true => decision != COMMIT
```

### VG-08 — first-visit requirements are conditional

```text
first_visit = true
=> id_reminder && early_arrival && registration && information_form
```

and explicitly:

```text
first_visit = false
=> no first_visit requirement is introduced by the reconciliation engine
```

## Counterexample loop

```text
Verification Goal
      |
      v
   ImandraX
   /      \
 PROOF    COUNTEREXAMPLE
  |             |
  v             v
PROMOTE       inspect trajectory
                |
                v
          refine invariant/model
                |
                v
             re-verify
```

The runtime `formalGate()` is deliberately deterministic and dependency-free so the hackathon project remains runnable without an ImandraX service. An ImandraX adapter can later submit equivalent VGs to the ImandraX CLI/API and persist proof/counterexample artifacts alongside the transaction receipt.

## Important boundary

Formal verification does not establish that CALL-E's conversational interpretation is true. It establishes properties of the decision model. Conversational claims still require evidence and authoritative state verification before a real-world commit.
