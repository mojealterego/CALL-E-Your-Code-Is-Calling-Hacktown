# Provider Boundary

The coordinator is provider-agnostic. A provider adapter should expose only the minimum execution surface required by the host application.

## Adapter contract

```text
prepare/authorize (host application)
        |
        v
provider.plan_call(...)
        |
        v
provider.run_call(...)
        |
        v
provider.get_call_run(...)
        |
        v
structured terminal evidence
```

The adapter must not decide whether the business transaction is committed. It returns provider observations; the host reconciler owns the business decision.

## CALL-E example

For CALL-E-backed implementations, keep SDK-specific code behind an adapter module. A typical lifecycle is:

```text
plan_call -> run_call -> get_call_run
```

Require the configured provider credential and an explicitly authorized recipient for live execution. Default demos and automated tests should use dry-run or deterministic fixtures and must not place real calls.

## Webhooks

Treat webhook input as untrusted. Validate the envelope, bind the event identifier to the expected call/operation, reject malformed payloads, and make processing replay-safe. A webhook can provide evidence; it cannot bypass the reconciliation policy.
