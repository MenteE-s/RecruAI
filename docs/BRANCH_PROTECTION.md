# RecruAI Branch Protection

Recommended settings for `main` (configure via GitHub UI or `gh` CLI).

## Required status checks

- `validate` — backend pytest, frontend Jest, production dependency audit,
  frontend build, admin lint/build, and Playwright smoke.

Do not list individual step names (`validate / Run backend tests`, etc.) as
required checks; GitHub reports the job check, not its steps.

`check-migrations` is path-filtered to backend changes. Requiring it would
leave frontend/admin-only PRs waiting for a check that never starts, so either
keep it advisory or make its workflow run on every PR before marking it
required.

## Settings

- Require a pull request before merging.
- Require approvals: 1.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Do not allow bypassing the above settings.
- Restrict who can push to matching branches (admins only).
- Do not allow force pushes.
- Do not allow deletions.

## GitHub CLI example

```bash
gh api repos/:owner/:repo/branches/main/protection -X PUT --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["validate"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

## Playwright E2E

Playwright smoke tests live in `frontend/e2e/`. They run in CI as part of the
`validate` job (see `npm run e2e`).
