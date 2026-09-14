# Ringostat telephony evidence adapter

Ringostat is an optional secondary evidence source for deployments where the authorized phone endpoint is managed by Ringostat. It is not the CALL-E execution primitive for this hackathon and it must never become a second autonomous execution authority.

## Role separation

```text
CALL-E       = conversation execution + structured conversational evidence
Ringostat    = independent telephony evidence
AegisFleet   = transaction authority + reconciliation
```

The adapter is intentionally downstream of the transaction preparation and authorization layers.

## Evidence available from Ringostat

Ringostat's Call Log API can export call metadata including call date, caller, destination, disposition, duration and recording information. The API is accessed with a project `Auth-key` and supports JSON/CSV export.

Current documented call statuses include:

- `ANSWERED`
- `NO+ANSWER`
- `FAILED`
- `BUSY`
- `REPEATED`

Ringostat also supports webhooks for telephony events, including incoming and outbound call lifecycle events. Webhook payloads can include a Ringostat call identifier and selected call metadata.

## Normalized evidence contract

A future adapter should normalize provider-specific data before it reaches the transaction engine:

```ts
export interface TelephonyEvidence {
  source: "ringostat";
  providerCallId: string;
  status: "answered" | "no_answer" | "failed" | "busy" | "repeated" | "unknown";
  durationSeconds?: number;
  recordingAvailable?: boolean;
  observedAt?: string;
  evidenceItems: string[];
}
```

The normalized contract is evidence, not authorization.

## Correlation

The adapter should correlate Ringostat evidence with the same logical operation key used by AegisFleet. Where a provider-specific identifier is available, preserve it as evidence metadata rather than replacing the AegisFleet transaction ID.

A phone number alone is not sufficient correlation or identity proof. The existing endpoint-bound capability remains the authorization artifact.

## Reconciliation rule

Ringostat can corroborate telephony facts:

- whether the call was answered;
- provider disposition;
- approximate duration;
- recording availability;
- provider-side call identifier.

Ringostat must not:

- authorize a transaction;
- override CALL-E structured evidence;
- turn a webhook into a commit signal;
- replace authoritative CALL-E recovery for an unresolved CALL-E call;
- infer participant identity from caller ID or a phone number.

The transaction engine therefore remains:

```text
prepared intent
      +
CALL-E terminal evidence
      +
optional independent telephony evidence
      ↓
RECONCILIATION
      ↓
COMMIT / ABORT / RECOVER
```

## Webhook handling

Ringostat documents webhook delivery as notification to an external URL and expects HTTP 200 acknowledgement. AegisFleet should therefore treat Ringostat webhooks as notifications, deduplicate them at the integration boundary, validate the payload shape, and fetch authoritative provider data when the integration exposes a read-after-event operation.

A webhook must never directly mutate consequential business state.

## Security boundary

`Auth-key` is a provider credential and must remain server-side. It must never be committed to source control, sent to an untrusted host, or placed in a client bundle.

Recordings and transcripts may contain personal data. A production adapter therefore needs explicit retention, access-control, deletion and jurisdiction policies before storing them in the AegisFleet evidence ledger.

## Why this adapter stays optional

The hackathon demo must remain self-contained around CALL-E. Ringostat only strengthens the architecture for PBX-managed deployments by adding an independent telephony evidence plane. It is deliberately not added as a runtime dependency until an actual Ringostat-managed endpoint is available for end-to-end verification.

References:

- https://help.ringostat.com/en/articles/6312678-ringostat-api-export-of-statistics-from-the-call-log
- https://help.ringostat.com/en/articles/6313229-how-to-realise-the-ringostat-integration-using-webhooks
- https://help.ringostat.com/en/articles/6413217-call-log-description-of-call-statuses
- https://ringostat.com/
