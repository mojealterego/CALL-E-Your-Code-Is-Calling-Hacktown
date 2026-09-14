# Meta-Architect Decision Loop

AegisFleet's Meta-Architect layer is a single governed decision loop around CALL-E. It is not a collection of autonomous agents and it does not grant reasoning modules authorization.

## Runtime chain

```text
INTENT
  ↓
CONTEXT + MEMORY
  ↓
CLAIM LEDGER
  ↓
REASONING GRAPH
  ↓
POLICY / AUTHORIZATION
  ├──────────────┐
  │ ALLOWED      │ UNKNOWN
  ↓              ↓
NEGOTIATION    RECOVER
  ↓
PREPARE
  ↓
CALL-E
  ↓
AUTHORITATIVE READBACK
  ↓
ADVERSARIAL GATE
  ↓
COMMIT / ABORT / RECOVER
  ↓
RECEIPT
  ↓
MEMORY / GRAPH
```

The governing distinction is:

> **CALL-E tells us what happened on the phone. AegisFleet decides whether the world is allowed to change.**

## Implemented controls

### 1. Negotiation Engine
`negotiatePreparedOptions()` ranks only prepared options. An unavailable date/time cannot be manufactured by the reasoning layer. Rejected options can move the conversation toward another prepared option or clarification.

### 2. Decision Matrix
`decisionMatrix()` requires identity, appointment, provider terminality, task completion, conversation completion, evidence, absence of contradiction, prepared slot state and trajectory safety before `commit`.

### 3. Risk / Confidence
`scoreRiskConfidence()` combines evidence coverage, execution completeness, contradictions, trajectory safety and historical degradation metrics. Confidence is a decision input, never truth or authorization by itself.

### 4. Adversarial decision checks
`adversarialDecisionChecks()` encodes fail-closed counterexamples:

- identity not verified → never disclose;
- appointment not verified → never commit;
- slot outside prepared availability → never commit;
- stale bitemporal state → recover;
- unknown CALL-E state → never create a second call;
- contradiction → recover;
- missing authoritative readback → never commit;
- missing required evidence → never commit.

### 5. Clarification loop
`clarifyAppointmentResponse()` resolves only explicit known dates/times. Unknown language remains unknown rather than being converted into a guessed appointment state.

### 6. Failure Memory
`buildFailureMemory()` converts observed failure/verification degradation into structured severity and facts suitable for offline assurance replay. It does not modify policy or authorization.

### 7. Trajectory metrics
`trajectoryMetrics()` counts side effects, unsafe events and retries after side effects. This is trajectory-level evidence rather than a single-message safety check.

### 8. Graceful degradation
`classifyAutonomy()` reduces operational autonomy as failure, contradiction, recovery, provider-error or verification-failure rates increase:

`normal → degraded → restricted → recovery-only → human-review`

Severe degradation never increases authority.

### 9. Provider-agnostic capability adapter
`buildCapabilityAdapter()` creates an operation-scoped capability representation independent of provider-specific conversation logic. The adapter carries provider, operation, participant, endpoint and an idempotency key. Provider capability does not equal business authorization.

### 10. Evidence → decision → receipt
`runMetaArchitectDecisionLoop()` joins the existing Claim Ledger, assurance context, formal gate, trajectory verification and adversarial checks. A successful commit emits a cryptographic receipt binding transaction and observed evidence to the decision.

## Counterfactual assurance

Before committing, the gate effectively asks what would make the decision unsafe. Examples include identity misunderstanding, appointment rejection, an unprepared reschedule slot, incomplete conversation, contradictory evidence, or missing provider readback.

The implementation is intentionally deterministic. It is an assurance contract, not a claim to reproduce a proprietary formal-verification system.

## Assurance homeostasis

The loop can operate in a reduced-autonomy state when telemetry shows that assumptions are degrading. This prevents a failing provider, parser or policy adaptation from silently receiving more authority.

## Evolution boundary

The Meta-Architect 34–69 layer already contains a governed improvement path. The Decision Loop is the operational consumer of those principles, while evolution remains outside live-call authorization:

```text
FAILURE → HYPOTHESIS → SANDBOX → RED TEAM → FORMAL → BENCHMARK → SHADOW → APPROVAL → PROMOTE
```

No generated candidate can modify credentials, policy, audit history or CALL-E authorization by itself.

## Verification

```bash
npm run verify:decision-loop
npm test
npm run typecheck
npm run demo
```

The regression suite covers prepared-only negotiation, fail-closed matrix checks, autonomy degradation, trajectory metrics, failure memory, risk/confidence scoring, receipts, successful commit and contradiction recovery.
