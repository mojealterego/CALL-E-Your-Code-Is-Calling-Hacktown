# Ringostat Adapter — Secondary Telephony Evidence Plane

## Purpose

Ringostat should be treated as an **optional secondary evidence source**, not as the execution engine and not as the business commit authority.

The hackathon implementation remains CALL-E-first. CALL-E performs the authorized outbound conversation. A Ringostat adapter can later corroborate telephony facts when the authorized endpoint is also managed by a Ringostat Virtual PBX or Call Tracking project.

## What Ringostat provides

Ringostat documents a Call Log API at `GET https://api.ringostat.net/calls/list` using an `Auth-key`. The export supports fields including `calldate`, `caller`, `dst`, `disposition`, `duration`, `billsec`, `uniqueid`, `recording`, `has_recording`, `call_card` and related call metadata.

Ringostat also supports webhooks for incoming and outgoing call lifecycle events. Its documented events include moments before/after a call, call pickup and forwarding. Webhooks can be filtered and can carry call identifiers and other call parameters.

Ringostat AI can additionally produce a post-call analysis containing a summary, customer/employee mood, recommendations and VTT transcription data.

## Evidence model

The adapter should normalize provider-specific facts into a narrow evidence contract rather than leaking Ringostat fields into the transaction engine:

```ts
interface TelephonyEvidence {
  source: "ringostat";
  providerCallId: string;
  status: "answered" | "no_answer" | "failed" | "busy" | "unknown";
  durationSeconds?: number;
  recordingAvailable?: boolean;
  observedAt?: string;
  evidenceItems: string[];
}
```

The transaction engine should continue to use its existing `ObservedEvidence` contract. `TelephonyEvidence` is corroborating evidence, not a replacement for CALL-E structured task evidence.

## Dual-evidence flow

```text
                    PREPARED TRANSACTION
                           │
                           ▼
                       CALL-E
                           │
                 conversation evidence
                           │
                           ├───────────────┐
                           │               │
                           ▼               ▼
                    CALL-E terminal    Ringostat
                       result           call log/webhook
                           │               │
                           └───────┬───────┘
                                   ▼
                            EVIDENCE FUSION
                                   │
                                   ▼
                             RECONCILIATION
                         /          |          \
                    COMMIT       ABORT       RECOVER
```

## Trust boundaries

### Ringostat webhook is not a commit signal

Ringostat webhooks are external notifications. They can be used to wake a reconciliation worker or enrich an audit record, but they must not directly mutate consequential business state.

The adapter should:

1. validate the configured authentication mechanism;
2. deduplicate the provider event when an event identifier is available;
3. normalize the telephony event;
4. correlate it to the existing operation/call identity;
5. re-fetch authoritative provider data when the event is incomplete or the decision is consequential;
6. pass the normalized evidence to the same reconciliation layer used by the CALL-E path.

### Phone number is still not identity

A Ringostat call record can establish telephony facts. It does not, by itself, establish that the human who answered is the intended participant. The existing AegisFleet Trust Plane therefore remains unchanged:

```text
WHO   = participant identity
WHERE = authorized phone endpoint
WHAT  = scoped capability
TTL   = bounded authorization lifetime
```

## Why this is useful for AegisFleet

The integration creates a second evidence dimension:

- **CALL-E:** what the conversation established;
- **Ringostat:** what the telephony infrastructure observed;
- **AegisFleet:** whether those facts satisfy the prepared transaction.

For example, a CALL-E result may say that the participant accepted Route B, while Ringostat independently records an answered call with a non-zero duration and a provider call identifier. The two sources can be correlated without allowing either provider to bypass the transaction policy.

Conversely, if CALL-E reports an apparent acceptance but Ringostat records a failed/no-answer call, the result must not be promoted to `COMMIT`. The reconciliation policy should produce `RECOVER` or `ABORT` according to the completeness and contradiction rules.

## API adapter boundary

Keep Ringostat-specific HTTP code outside the transaction engine:

```text
src/
  transaction.ts       ← provider-independent decision logic
  orchestrator.ts      ← workflow
  calle.ts             ← CALL-E execution adapter
  recovery.ts          ← CALL-E authoritative recovery
  ringostat.ts         ← future Ringostat evidence adapter
```

The future `ringostat.ts` module should accept a server-side `Auth-key` from secret storage and expose narrow functions such as:

```ts
getCallLogWindow(...): Promise<TelephonyEvidence[]>
normalizeWebhook(...): TelephonyEvidence
```

Do not place the Ringostat `Auth-key` in frontend code, repository files, transaction metadata, receipts or logs.

## Hackathon scope decision

Do **not** make Ringostat a required dependency for the current CALL-E submission.

The correct role is:

> **CALL-E is the required voice execution primitive. Ringostat is an optional secondary telephony evidence adapter.**

This preserves the hackathon requirement while making the architecture extensible to real enterprise PBX deployments.

## Sources

- Ringostat API: Export of statistics from the Call Log — `https://ringostat.readme.io/reference/get_calls-list`
- Ringostat API integration documentation — `https://help.ringostat.com/en/articles/6306981-how-to-configure-the-integration-with-your-system-via-ringostat-api`
- Ringostat incoming-call webhook documentation — `https://help.ringostat.com/en/articles/6559993-webhooks-incoming-call-event`
- Ringostat AI processed-call webhook documentation — `https://help.ringostat.com/en/articles/9281387-webhooks-event-call-processed-by-ai`
