# 3-Minute Judge Demo Script

## 0:00–0:15 — The problem

Show the appointment-confirmation scenario.

Say:

> "The hard part is not making an AI phone call. The hard part is deciding whether a phone conversation is enough evidence to change a real-world state."

## 0:15–0:35 — PREPARE

Show the frozen transaction and prepared availability.

```text
Transaction: TX-AF-DEMO-0001
Clinic: Przychodnia Medica Nova
Patient: Adam Miauczyński
Doctor: doktor Pawlak
Current appointment: 2026-09-15 10:00
Purpose: appointment confirmation / reschedule / cancellation
Prepared replacement slots:
  2026-09-15 09:00
  2026-09-15 11:30
  2026-09-16 08:30
  2026-09-16 13:00
  2026-09-17 10:30
```

Say:

> "AegisFleet freezes the appointment intent and the allowed replacement slots before the phone call. The voice agent can negotiate naturally, but it cannot invent availability."

## 0:35–1:25 — CALL-E

Run the explicitly configured live path with the authorized test recipient.

The agent conducts a natural Polish receptionist-style conversation. The key point is that it is a branching conversation, not a questionnaire.

### Attendance confirmed — first visit

```text
"Dzień dobry, Anna z Przychodni Medica Nova. Czy rozmawiam z panem Adamem Miauczyńskim?"

"Dzwonię w sprawie jutrzejszej wizyty. Chciałam tylko potwierdzić, czy będzie pan na wizycie u doktora Pawlaka?"

Adam: "Tak."

"Czy będzie to pana pierwsza wizyta w naszej przychodni?"

Adam: "Tak."

"W takim razie chciałam jeszcze przypomnieć, żeby zabrać ze sobą dowód osobisty lub inny dokument potwierdzający tożsamość. Proszę też przyjść około 30 minut przed wizytą, żeby spokojnie zgłosić się w rejestracji i wypełnić formularz informacyjny, ponieważ jest to pana pierwsza wizyta."

"Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?"

Adam: "Nie."

"W takim razie wizytę mamy potwierdzoną. Dziękuję za rozmowę i życzę miłego dnia."
```

### Attendance confirmed — not the first visit

```text
Adam: "Tak, będę."

"Czy będzie to pana pierwsza wizyta w naszej przychodni?"

Adam: "Nie, już wcześniej byłem."

"Rozumiem, dziękuję. W takim razie wszystko się zgadza."

"Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?"

Adam: "Nie."

"W takim razie wizytę mamy potwierdzoną. Dziękuję za rozmowę i życzę miłego dnia."
```

### Adam will not attend — reschedule

```text
Adam: "Nie, jutro nie przyjdę."

"Rozumiem. W takim razie mogę sprawdzić najbliższy wolny termin."

"Najbliższy wolny termin mam 15 września o 9:00. Czy ten termin panu odpowiada?"

Adam: "Nie, godzina mi nie pasuje."

"Rozumiem. A sam dzień panu odpowiada, tylko godzina nie?"

Adam: "Tak, dzień mi pasuje."

"Która godzina byłaby dla pana dogodna?"

Adam: "11:30."

"Tak, mam wolny termin 15 września o 11:30. W takim razie zapisuję pana na ten termin. Czy jest coś, w czym jeszcze mogę pomóc?"
```

If the day does not suit Adam, offer the next prepared date/time. If the time does not suit him, ask for another time on the same day, but accept it only if that exact time is in prepared availability. Continue until a prepared slot is accepted or options are exhausted.

### Adam no longer wants the appointment

```text
Adam: "Nie, jutro nie przyjdę. I właściwie nie chcę już tej wizyty."

"Rozumiem. W takim razie anuluję tę wizytę. Dziękuję za informację i życzę miłego dnia."
```

No replacement slots are offered after an explicit cancellation.

## 1:25–1:45 — EVIDENCE

Show the structured result for the observed branch. For a first visit confirmation it contains:

```text
patient_confirmed: yes
appointment_confirmed: yes
doctor_confirmed: doktor Pawlak
first_visit: yes
identity_document_reminder_given: true
arrive_30_minutes_early: true
registration_reminder_given: true
information_form_reminder_given: true
appointment_decision: confirm
conversation_completed: true
confidence: high
```

For a reschedule, the result additionally records the accepted prepared slot. For cancellation, it records `appointment_decision: cancel` and no replacement slot.

Point out that the spoken conversation is converted into explicit, auditable evidence.

## 1:45–2:05 — RECONCILE → COMMIT / ABORT

Show:

```text
attendance confirmed + first-visit conditions satisfied
        OR
accepted prepared reschedule slot
        ↓
DECISION: COMMIT
```

For cancellation:

```text
patient explicitly declines appointment
        ↓
DECISION: ABORT
```

Say:

> "The voice agent can understand and negotiate. The transaction layer decides what state change is actually authorized."

## 2:05–2:20 — CONFLICT → ABORT

Show a deterministic conflict fixture:

```text
prepared doctor: doktor Pawlak
observed doctor: doktor Nowak

DECISION: ABORT
reason: confirmed doctor does not match prepared appointment
```

Say:

> "A confident conversation is still not enough if the evidence conflicts with what was prepared."

## 2:20–2:35 — UNKNOWN → RECOVER

Show an incomplete result:

```text
appointment_decision: unknown
CALL-E terminal evidence: incomplete

DECISION: RECOVER
```

Say:

> "Unknown is not success and it is not permission to blindly place another call. Recovery first reconciles the existing call."

## 2:35–2:50 — EVOLUTION ASSURANCE

Show:

```text
FAILURE / DRIFT
      ↓
COUNTERFACTUAL
      ↓
CHALLENGER
      ↓
REPLAY
      ↓
SHADOW
      ↓
PROMOTION CANDIDATE
      ↓
EXPLICIT AUTHORIZATION
```

Say:

> "A failure does not become a new permission. It becomes a regression case. Improvements must survive replay, challenge and comparison before a human-authorized promotion."

## 2:50–3:00 — RECEIPT + closing

Show the transaction receipt, system state manifest, and hash-linked audit digest.

Point to:

- transaction ID;
- CALL-E call ID;
- patient identity evidence;
- appointment evidence;
- selected replacement slot, if any;
- decision;
- verification state;
- trust state;
- freshness state;
- previous audit digest;
- current audit digest.

Say:

> "CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change."

## Recording safety

- Use only the authorized test recipient.
- Keep `CALLE_API_KEY` out of the recording and repository.
- Use `CALL_E_MODE=live` only for the intended live demonstration.
- The default `npm run demo` path remains provider-free and makes no phone call.
