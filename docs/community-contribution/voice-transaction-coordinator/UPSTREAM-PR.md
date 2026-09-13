# Upstream Community Contribution

Target repository: `CALLE-AI/awesome-phone-call-agents`

Target path: `skills/voice-transaction-coordinator/`

## Required steps

1. Create a fork of `CALLE-AI/awesome-phone-call-agents` with your GitHub account.
2. Create a branch from the fork's `main`, for example:
   `feat/voice-transaction-coordinator`
3. Copy the complete prepared skill folder:
   `docs/community-contribution/voice-transaction-coordinator/`
   to:
   `skills/voice-transaction-coordinator/`
   This includes `SKILL.md` and `references/examples.md`.
4. Add the following entry to the community README under **Skills**:

```md
- [`voice-transaction-coordinator`](skills/voice-transaction-coordinator/) - Reconciles a phone-call result against a prepared business transaction and fail-closes to COMMIT, ABORT, or RECOVER instead of treating conversation completion as business commit.
```

5. Run the upstream repository validator:

```bash
python3 scripts/validate_repository.py
```

6. Commit with a focused message, for example:
   `Add voice transaction coordinator skill`
7. Open a pull request from the fork branch to `CALLE-AI/awesome-phone-call-agents:main`.

## PR title

`Add voice transaction coordinator skill`

## PR summary

Adds a provider-independent Agent Skill for governing consequential phone workflows with a prepare/authorize/verify/reconcile boundary. It explicitly separates provider completion from business acceptance, uses COMMIT/ABORT/RECOVER dispositions, requires authoritative recovery before a new outbound attempt, treats webhooks as notifications, and supports dry-run execution.

The skill is intentionally not a duplicate logistics application; it packages the reusable transaction-reconciliation pattern demonstrated by AegisFleet.

## Validation boundary

The current ChatGPT GitHub connection can read `CALLE-AI/awesome-phone-call-agents` but does not have write access to create the upstream branch or PR. The payload is therefore prepared here for immediate fork submission.
