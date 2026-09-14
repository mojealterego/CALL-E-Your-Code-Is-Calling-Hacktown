# Hackathon Submission Package

## Submission name

**AegisFleet — Voice Transaction Coordinator**

## One-line pitch

**AegisFleet treats a phone call as an unreliable transaction participant: CALL-E performs the conversation, while AegisFleet decides whether the evidence is sufficient to commit the operational state.**

## The problem

Phone work becomes dangerous when a conversation is treated as equivalent to a completed business action. A participant can reject the proposed change, provide conflicting terms, become unreachable, or produce an ambiguous answer. A system that turns any apparently positive conversation into a downstream write can therefore create operational errors or duplicate real-world actions.

## The solution

AegisFleet introduces a prepare/verify/commit boundary around CALL-E:

`intent → PREPARE → AUTHORIZE → CALL-E → terminal evidence → RECONCILE → COMMIT / ABORT / RECOVER → RECEIPT`

Before the call, the system freezes the exact operational constraints and creates a short-lived capability bound to the participant, authorized endpoint and those constraints. After the call, it compares provider evidence with the prepared state. Only a matching, high-confidence, successfully completed call can reach `COMMIT`.

## What the judges should notice

1. **Real phone-work problem:** logistics exception recovery requires real people and real phone endpoints.
2. **Non-trivial CALL-E use:** the project uses the CALL-E server SDK as the real execution layer, with E.164 recipients, structured extraction, idempotency and terminal evidence.
3. **Clear innovation boundary:** the call is not the business commit boundary. AegisFleet adds an explicit transaction reconciliation layer above phone execution.
4. **Trust plane:** participant identity, authorized phone endpoint and transaction-scoped capability are kept separate. A phone number is not treated as proof of identity.
5. **Safety by construction:** live mode is explicit; authorized E.164 recipients are required; fixture numbers are blocked; uncertain execution becomes `RECOVER`.
6. **Machine-checkable evidence:** route, acceptance, ETA, confidence, terminal completion and provider evidence are preserved for reconciliation.
7. **Failure semantics:** conflicting evidence produces `ABORT`; incomplete evidence produces `RECOVER`; neither silently becomes success.
8. **Verifiable auditability:** transitions are append-only and hash-linked, while the transaction receipt cryptographically binds the prepared transaction, scoped capability, observed evidence and final decision.
9. **Recovery discipline:** the project includes authoritative CALL-E re-fetch so a webhook is treated as a notification rather than a state-of-truth commit signal; recovery never places a second outbound call for the same unresolved execution.
10. **Extensible telephony evidence:** Ringostat was analyzed as an optional secondary adapter for PBX-managed endpoints. Its call-log/webhook evidence can corroborate telephony facts without replacing CALL-E or bypassing reconciliation.

## Demo

Recommended recording: under 3 minutes. Use `docs/demo-script.md` as the shot list.

The intended demonstration is:

1. PREPARE Route B / ETA ≤ 19:00.
2. AUTHORIZE the exact participant/endpoint/constraints.
3. Execute a real authorized CALL-E test call.
4. Show terminal evidence: Route B / accepted / 18:40 / completed.
5. RECONCILE → COMMIT.
6. Show a conflicting Route C fixture → ABORT.
7. Show incomplete/unknown evidence → RECOVER and authoritative re-fetch of the existing call.
8. Finish with the transaction receipt and audit digest.

The default `npm run demo` path remains provider-free and safe for judges to reproduce.

## Important submission requirement

The hackathon requires a contribution PR to:

`CALLE-AI/awesome-phone-call-agents`

The community contribution is prepared as a reusable `skills/` entry at `skills/voice-transaction-coordinator/`, documenting the transaction-reconciliation pattern rather than duplicating a generic logistics app. It covers setup, real-call side effects, cancellation/recovery behavior, credentials and dry-run/preview behavior.

## Devpost text

AegisFleet is a voice transaction coordinator for real-world phone work. When a logistics exception occurs, the system freezes the exact operational intent, creates a short-lived endpoint-bound capability, uses CALL-E to contact the authorized participant, collects structured terminal evidence, reconciles that evidence against the prepared state, and produces one of three explicit decisions: COMMIT, ABORT, or RECOVER. A cryptographic receipt binds the decision to the prepared intent, capability and observed evidence.

The key innovation is treating the phone call as an unreliable participant in a distributed real-world transaction. CALL-E owns the conversation; AegisFleet owns the commit boundary. A participant can disagree with the prepared route, the call can fail, or the evidence can remain unknown without the system turning that uncertainty into an automatic business action. Recovery re-fetches authoritative provider state before a new outbound attempt is considered, so uncertainty does not become duplicate execution.

The architecture also leaves a clean secondary telephony evidence plane. In a Ringostat-managed deployment, call-log and webhook facts can corroborate whether a call was answered, its disposition, duration or recording availability. Those facts remain evidence only; they cannot bypass AegisFleet reconciliation or replace CALL-E as the hackathon execution primitive.

Built with TypeScript, the CALL-E server SDK, strict JSON Schema contracts, provider idempotency, transaction reconciliation, append-only audit history, cryptographic receipts, webhook event validation, authoritative recovery and deterministic tests.
