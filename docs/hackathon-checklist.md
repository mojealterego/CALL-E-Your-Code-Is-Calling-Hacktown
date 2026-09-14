# Hackathon Finalization Checklist

## Verified in repository

- [x] TypeScript project builds with `npm run typecheck`.
- [x] Automated test suite passes in GitHub Actions on the latest verified `main` head (`05a286a7d33df136c60a35a78326c62ee9d09b2b`).
- [x] Default `npm run demo` path is deterministic dry-run with no provider/phone call.
- [x] Policy gate is authoritative for execution.
- [x] Structured outcome validation is enforced, including runtime rejection of unexpected fields.
- [x] Evidence and confidence gates prevent unsafe automatic resolution.
- [x] Idempotency is reserved before provider I/O.
- [x] Terminal idempotent reuse does not create a duplicate Reflexion finding.
- [x] Reflexion findings are stored as episodic bitemporal memory and cannot change incident state.
- [x] Synthetic red-team cases are deterministic and regression-tested.
- [x] Webhook replay/malformed-input protections are covered by the evaluation plan.
- [x] Research-track concepts are explicitly separated from implemented capabilities.
- [x] Reusable community-contribution package is present under `docs/community-contribution/voice-transaction-coordinator/`.
- [x] Community skill has YAML frontmatter, provider-neutral control rules and separate provider/transaction references.

## Required before public submission

- [ ] Run the final local demo from a clean checkout.
- [ ] If using live CALL-E, configure an authorized test recipient and `CALL_E_MODE=live` explicitly.
- [ ] Verify the live result manually; do not treat a successful phone connection as successful incident resolution unless the structured outcome passes all gates.
- [ ] Record the final demo (target: <3 minutes).
- [ ] Publish the demo using the hackathon-required public mechanism.
- [ ] Open the required contribution PR to `CALLE-AI/awesome-phone-call-agents` in the correct contribution area.
- [ ] Complete the Devpost registration/submission fields.
- [ ] Include the repository URL and contribution PR URL where required.
- [ ] Perform a final audit of claims so no live deployment, call, PR, benchmark, or credential is represented as completed unless actually completed.

## Submission discipline

This checklist intentionally distinguishes repository verification from external submission actions. External actions are not marked complete merely because the repository contains instructions for them.

## Work log

2026-09-14
- Tightened runtime outcome validation to enforce the closed schema promised by the architecture and JSON contract.
- Added a regression test proving unexpected outcome fields are rejected.
- Updated this checklist so repository verification points to the latest known green CI head before the current validation hardening commits.
