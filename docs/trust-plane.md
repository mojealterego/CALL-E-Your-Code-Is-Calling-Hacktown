# Trust Plane: from phone endpoint to governed participant

The project can evolve beyond a phone number as the identity of a participant.

The supplied private-network design suggested a useful separation between a subscriber identity, a routing/resource identity and the voice application layer. AegisFleet applies the same architectural idea without importing any SIM secrets, private keys, IMSI values or infrastructure credentials.

## 1. Participant identity is not a phone number

A production participant should have a stable pseudonymous identifier such as:

```text
participant:driver-42
```

The phone number is an execution endpoint. It is not the authority to change the prepared transaction.

This gives us three separate concepts:

```text
WHO      = participant identity
WHERE    = currently authorized phone endpoint
WHAT     = capability granted for this transaction
```

## 2. Capability-scoped calling

Before CALL-E execution, AegisFleet creates a short-lived capability bound to:

- operation key;
- participant ID;
- transaction scope;
- exact prepared constraints;
- issue time and expiry.

The capability is deliberately non-secret. Its purpose is to make the intended authorization machine-checkable and auditable, not to pretend that a hash is an identity credential.

The CALL-E metadata carries the capability fingerprint so the provider-side call can be correlated with the prepared authorization artifact.

## 3. Why this matters

A normal voice agent often has this implicit model:

```text
phone number -> call -> answer -> action
```

AegisFleet uses:

```text
participant identity
       |
       +-- authorized endpoint
       |
       +-- scoped capability
       |
       +-- prepared transaction
       |
       +-- CALL-E execution
       |
       +-- authoritative evidence
       |
       +-- COMMIT / ABORT / RECOVER
```

Changing the endpoint does not change the authority. Changing the route constraints invalidates the capability binding. An expired capability cannot be treated as indefinitely reusable.

## 4. Network-inspired future architecture

The supplied 5G/6G material also suggests a future separation of planes:

```text
IDENTITY PLANE
participant / endpoint / device attestation

COGNITION PLANE
speech -> extraction -> evidence

TRANSACTION PLANE
prepare -> reconcile -> commit/abort/recover

AUDIT PLANE
receipt -> digest chain -> replayable history

NETWORK PLANE
SIP / IMS / private cellular / edge transport
```

The critical design rule is that the network plane and cognition plane never become the business commit authority. They provide connectivity and observations; the transaction plane remains the final control boundary.

## 5. What we intentionally do not claim

This layer does not currently provide carrier-grade subscriber authentication, voice biometrics, radio-layer attestation, or cryptographic proof of human identity. Those are future adapters, not capabilities that should be implied by a software hash or CALL-E result.

The immediate prototype is therefore honest: it demonstrates scoped authorization metadata and transaction binding while leaving carrier/device identity to a future trusted identity provider.
