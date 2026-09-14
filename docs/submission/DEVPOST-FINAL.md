# Devpost Final Submission

## Project title

**AegisFleet — Voice Transaction Coordinator**

## Tagline

**CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change.**

## Description

AegisFleet is a voice transaction coordinator for consequential real-world phone work. It addresses a specific failure mode in voice automation: a phone conversation can complete while the underlying business action remains unverified, conflicts with the prepared intent, or is left uncertain after provider failure.

AegisFleet creates an explicit prepare/authorize/verify/reconcile boundary around CALL-E:

`intent → PREPARE → AUTHORIZE → CALL-E → terminal evidence → RECONCILE → COMMIT / ABORT / RECOVER → RECEIPT`

For a logistics exception, the system first freezes the exact proposed route and maximum ETA. It then creates a short-lived capability bound to the participant, authorized phone endpoint, scope and exact constraints. CALL-E performs the real phone interaction and returns structured evidence. AegisFleet independently verifies terminal provider state and reconciles the observed evidence against the prepared transaction.

A matching, high-confidence, successfully completed result can reach COMMIT. Complete conflicting evidence produces ABORT. Incomplete or uncertain execution produces RECOVER rather than silently becoming success or blindly placing a duplicate call.

The system also treats a phone number as an execution endpoint rather than proof of identity. Provider idempotency protects retries of the same logical operation. Webhooks are treated as notifications rather than authoritative business state. Recovery re-fetches the existing CALL-E call before any new outbound attempt is considered. The final operational decision is recorded in a cryptographic receipt binding the prepared transaction, scoped capability, observed evidence and decision.

The architecture is intentionally reusable beyond logistics: the same transaction coordinator can govern appointment changes, service dispatch, procurement confirmations, incident escalation and other phone workflows where a conversation may create consequential side effects.

The project includes a provider-independent community Agent Skill, `voice-transaction-coordinator`, prepared for the CALL-E Awesome Phone Call Agents repository. The skill packages the reusable transaction-reconciliation pattern rather than duplicating a logistics application.

## Why CALL-E matters here

CALL-E is not decorative infrastructure in this project. The TypeScript server SDK is the real phone execution layer. The application uses structured result schemas, E.164 recipients, provider idempotency, terminal call state, completion confidence, evidence and authoritative recovery.

The important boundary is deliberate: CALL-E owns the conversation; AegisFleet owns the business commit decision.

## Demo flow

1. Prepare Route B with maximum ETA 19:00.
2. Authorize the exact participant, endpoint and constraints.
3. Place an authorized CALL-E test call.
4. Show terminal evidence: Route B, accepted, 18:40, high confidence, completed.
5. Reconcile and produce COMMIT.
6. Feed conflicting Route C evidence and produce ABORT.
7. Feed incomplete/unknown evidence and produce RECOVER.
8. Show authoritative recovery of the existing call and the final transaction receipt.

The repository's default `npm run demo` path is provider-free and safe for reproduction without making a phone call.

## Technical highlights

- TypeScript + CALL-E server SDK
- strict JSON Schema contracts
- provider idempotency
- endpoint-bound, short-lived capabilities
- deterministic COMMIT / ABORT / RECOVER reconciliation
- authoritative provider re-fetch during recovery
- append-only hash-linked audit history
- SHA-256 transaction/evidence/decision receipts
- webhook envelope validation and event-ID binding
- deterministic unit/regression tests
- safe dry-run path

## Community contribution

**Contribution area:** Agent Skills

**Target:** `CALLE-AI/awesome-phone-call-agents`

**Skill:** `skills/voice-transaction-coordinator/`

**PR title:** `Add voice transaction coordinator skill`

**PR URL:** _Insert the final upstream PR URL after the fork PR is created._

## Testing

Verified on the current submission branch: GitHub Actions CI run #520 completed successfully with `npm test`, TypeScript type checking, and the deterministic `npm run demo`. CodeRabbit status is also successful.

The live-call workflow is deliberately separate from normal CI. It requires explicit authorization for one live CALL-E test, performs a credential preflight without placing a call, then runs regression tests and typecheck before the single live transaction.

## Live-demo requirement

The recorded live demonstration must use only an authorized E.164 test recipient. Never expose the CALL-E API key or private phone number in the video, repository or submission text.

## Submission checklist

- [ ] Join/register for the CALL-E hackathon on Devpost.
- [x] Create fork of `CALLE-AI/awesome-phone-call-agents`.
- [x] Add `skills/voice-transaction-coordinator/` to the fork contribution branch.
- [ ] Add README resource-list entry in the fork branch.
- [ ] Run `python3 scripts/validate_repository.py` in the fork.
- [ ] Open upstream PR and copy its URL here and into Devpost.
- [ ] Record a public video under 3 minutes showing the project functioning.
- [ ] Upload video publicly to YouTube or Vimeo.
- [ ] Enter CALL-E account email in Devpost.
- [ ] Enter optional functional demo URL if available.
- [ ] Submit before the official deadline.
