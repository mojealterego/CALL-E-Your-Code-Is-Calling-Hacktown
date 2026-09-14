# Hackathon Finalization Checklist

## Verified in repository

- [x] TypeScript project builds with `npm run typecheck` after the cognitive-module indexed-access fix; a fresh CI run is still the final remote confirmation.
- [x] Automated test suite passes in CI for the cognitive-module revision: 12 test files / 40 tests passed before the typecheck failure.
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
- [x] One-command final verification is available as `npm run verify:final`.
- [x] Bounded cognitive control primitives are implemented in `src/cognitive-modules.ts` with regression coverage.
- [x] Live CALL-E workflow explicitly authorizes one test call and now checks out `main`, so the live test cannot silently execute the stale feature branch.

## Required before public submission

- [ ] Verify the current `main` head with GitHub Actions or a clean checkout using `npm run verify:final`.
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
- Added bounded cognitive-control primitives for working memory, HDC/holographic indexing, semantic retrieval, counterfactual analysis, MCP capability scoping, temporal decay, Pareto selection, load shedding, prompt compression, hard-negative mining, trust regulation and gated mutation evaluation.
- Added regression coverage for the new cognitive modules; the first CI run reached 12 passing test files / 40 passing tests.
- Fixed the strict TypeScript indexed `Uint8Array` access exposed by CI.
- Corrected the live CALL-E workflow to execute the current `main` branch rather than the historical feature branch.
- No autonomous source mutation, production hot-swap, credential access or phone-executor self-modification was introduced.
