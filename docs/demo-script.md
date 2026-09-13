# 3-Minute Judge Demo Script

## 0:00–0:15 — The problem

Show the appointment-confirmation scenario.

Say:

> "The hard part is not making an AI phone call. The hard part is deciding whether a phone conversation is enough evidence to change a real-world state."

## 0:15–0:35 — PREPARE

Show:

```text
Transaction: TX-AF-DEMO-0001
Clinic: Przychodnia Medica Nova
Patient: Adam Miauczyński
Doctor: doktor Pawlak
Purpose: appointment confirmation
```

Say:

> "AegisFleet freezes the exact appointment intent before the phone call. The voice agent can collect evidence, but it does not get authority to invent or change the appointment."

## 0:35–1:30 — CALL-E

Run the explicitly configured live path with an authorized test recipient.

The agent should conduct a natural Polish receptionist-style conversation:

```text
"Dzień dobry, Anna z Przychodni Medica Nova. Czy rozmawiam z panem Adamem Miauczyńskim?"

"Dzwonię w sprawie jutrzejszej wizyty. Chciałam tylko potwierdzić, czy będzie pan na wizycie u doktora Pawlaka?"

"Czy będzie to pana pierwsza wizyta w naszej przychodni?"

[first visit]
"W takim razie chciałam jeszcze przypomnieć, żeby zabrać ze sobą dowód osobisty lub inny dokument potwierdzający tożsamość. Proszę też przyjść około 30 minut przed wizytą, żeby spokojnie zgłosić się w rejestracji i wypełnić formularz informacyjny, ponieważ jest to pana pierwsza wizyta."

"Czy jest coś, w czym jeszcze mogę pomóc? Ma pan jakieś pytania?"

[no questions]
"W takim razie wizytę mamy potwierdzoną. Dziękuję za rozmowę i życzę miłego dnia."
```

Say:

> "CALL-E owns the phone interaction. AegisFleet does not give the voice agent authority to change the business state."

## 1:30–1:50 — EVIDENCE

Show:

```text
appointment_confirmed: yes
doctor_confirmed: doktor Pawlak
first_visit: yes
identity_document_reminder_given: true
arrive_30_minutes_early: true
registration_reminder_given: true
conversation_completed: true
confidence: high
```

Point out that the spoken conversation is converted into explicit, auditable evidence.

## 1:50–2:05 — RECONCILE → COMMIT

Show:

```text
prepared patient == observed patient
prepared doctor == observed doctor
appointment_confirmed = yes
first_visit instructions satisfied
conversation_completed = true
confidence = high

authoritative terminal evidence
        ↓
DECISION: COMMIT
```

Say:

> "Only now is the appointment state allowed to change."

## 2:05–2:25 — CONFLICT → ABORT

Show a deterministic conflict fixture:

```text
prepared doctor: doktor Pawlak
observed doctor: doktor Nowak

DECISION: ABORT
reason: confirmed doctor does not match prepared appointment
```

Say:

> "A confident conversation is still not enough if the evidence conflicts with what was prepared."

## 2:25–2:45 — UNKNOWN → RECOVER

Show an incomplete result:

```text
appointment_confirmed: unknown
CALL-E terminal evidence: incomplete

DECISION: RECOVER
```

Say:

> "Unknown is not success and it is not permission to blindly place another call. Recovery first reconciles the existing call."

## 2:45–3:00 — AUDIT + closing

Show the transaction receipt and hash-linked audit digest.

Point to:

- transaction ID;
- CALL-E call ID;
- appointment evidence;
- decision;
- previous audit digest;
- current audit digest.

Say:

> "CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change."

## Recording safety

- Use only an authorized test recipient.
- Keep `CALLE_API_KEY` out of the recording and repository.
- Use `CALL_E_MODE=live` only for the intended live demonstration.
- The default `npm run demo` path remains provider-free and makes no phone call.
