# Hackathon Submission Package

## Submission name

**AegisFleet — Voice Transaction Coordinator**

## One-line pitch

**AegisFleet treats a phone call as an unreliable transaction participant: CALL-E performs the conversation, while AegisFleet decides whether the evidence is sufficient to commit the operational state.**

## The problem

Phone work becomes dangerous when a conversation is treated as equivalent to a completed business action. A participant can reject the proposed change, provide conflicting terms, become unreachable, or produce an ambiguous answer. A system that turns any apparently positive conversation into a downstream write can therefore create operational errors or duplicate real-world actions.

## The solution

AegisFleet introduces a prepare/verify/commit boundary around CALL-E:

`intent → PREPARE → CALL-E → terminal evidence → RECONCILE → COMMIT / ABORT / RECOVER`

Before the call, the system freezes the exact operational constraints. After the call, it compares the provider evidence with those constraints. Only a matching, high-confidence, successfully completed call can reach `COMMIT`.

## What the judges should notice

1. **Real phone-work problem:** logistics exception recovery requires real people and real phone endpoints.
2. **Non-trivial CALL-E use:** the project uses the CALL-E server SDK as the real execution layer, with E.164 recipients, structured extraction, idempotency and terminal evidence.
3. **Clear innovation boundary:** the call is not the business commit boundary. AegisFleet adds an explicit transaction reconciliation layer above phone execution.
4. **Safety by construction:** live mode is explicit; authorized E.164 recipients are required; fixture numbers are blocked; uncertain execution becomes `RECOVER`.
5. **Machine-checkable evidence:** route, acceptance, ETA, confidence, terminal completion and provider evidence are preserved for reconciliation.
6. **Failure semantics:** conflicting evidence produces `ABORT`; incomplete evidence produces `RECOVER`; neither silently becomes success.
7. **Auditability:** the prototype maintains append-only, hash-linked transition history and a transaction receipt.
8. **Reusable architecture:** the transaction layer is provider-independent and the CALL-E adapter is isolated from business policy.

## Demo

Recommended recording: under 3 minutes. Use `docs/demo-script.md` as the shot list.

The intended demonstration is:

1. PREPARE Route B / ETA ≤ 19:00.
2. Execute a real authorized CALL-E test call.
3. Show terminal evidence: Route B / accepted / 18:40 / completed.
4. RECONCILE → COMMIT.
5. Show a conflicting Route C fixture → ABORT.
6. Show incomplete/unknown evidence → RECOVER.
7. Finish with the transaction receipt and audit digest.

The default `npm run demo` path remains provider-free and safe for judges to reproduce.

## Important submission requirement

The hackathon requires a contribution PR to:

`CALLE-AI/awesome-phone-call-agents`

The project repository is the source-development repository. The community contribution must be opened against the appropriate `apps/` contribution area and must document setup, side effects, cancellation/recovery behavior, credentials and dry-run/preview behavior.

## Devpost text

AegisFleet is a voice transaction coordinator for real-world phone work. When a logistics exception occurs, the system freezes the exact operational intent, uses CALL-E to contact the authorized participant, collects structured terminal evidence, reconciles that evidence against the prepared state, and produces one of three explicit decisions: COMMIT, ABORT, or RECOVER.

The key innovation is treating the phone call as an unreliable participant in a distributed real-world transaction. CALL-E owns the conversation; AegisFleet owns the commit boundary. A participant can disagree with the prepared route, the call can fail, or the evidence can remain unknown without the system turning that uncertainty into an automatic business action.

Built with TypeScript, the CALL-E server SDK, strict JSON Schema contracts, provider idempotency, transaction reconciliation, append-only audit history, webhook event validation and deterministic tests.
