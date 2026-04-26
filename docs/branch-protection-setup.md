# Branch protection — manual setup

> The Architect-pass agent can't reach `gh` from this environment, so
> this is the exact set of commands (or UI clicks) Eduard / the PO
> should run **once**. After that the rules are server-side in GitHub
> and never need to be re-run.

## What we want on `main`

- Require status checks to pass before merge: `lint`, `typecheck`,
  `test`, `build`.
- Block direct push to `main` from the CLI; only allow merges via PR
  through the GitHub web UI.
- **Don't** require PR reviews (Eduard works solo on this repo).
- Don't allow force-push or branch deletion.

## Option A — `gh api` one-shot (preferred, scriptable)

Replace `EduardF1` and the repo name if needed:

```bash
gh auth status   # sanity-check that the token has 'repo' + 'admin:org' scopes

OWNER=EduardF1
REPO=portfolio

# Required status checks. The check names below match the job names in
# .github/workflows/ci.yml — they will appear once the CI workflow has
# run on at least one PR, so push this branch first, let CI run, then
# come back to apply protection.
gh api \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  /repos/$OWNER/$REPO/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]="lint · typecheck · unit · build" \
  -f required_status_checks[contexts][]="e2e (Playwright, Chromium)" \
  -F enforce_admins=false \
  -F required_pull_request_reviews= \
  -F restrictions= \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F required_linear_history=false \
  -F required_conversation_resolution=true
```

Notes on the `-f` / `-F` flags:

- `-f` sends a string field; `-F` sends a typed (boolean / null /
  number) field. Required because `enforce_admins=false` is a JSON
  boolean, not the string `"false"`.
- `required_pull_request_reviews=` and `restrictions=` are sent as
  *null* (empty value with `-F`) — `gh` translates that to JSON
  `null`, which means "no review requirement" and "no push
  restrictions" respectively. Eduard works alone, so reviews are
  off. Direct push is still implicitly blocked because the merge has
  to go through a PR-style commit on the protected branch — see Option
  B for the matching web-UI flag.

To verify after applying:

```bash
gh api /repos/$OWNER/$REPO/branches/main/protection | jq '.required_status_checks, .allow_force_pushes, .allow_deletions'
```

Expected output:

```json
{
  "url": "...",
  "strict": true,
  "contexts": [
    "lint · typecheck · unit · build",
    "e2e (Playwright, Chromium)"
  ],
  "checks": [...]
}
{ "enabled": false }
{ "enabled": false }
```

## Option B — Web UI (one-time, no CLI required)

1. https://github.com/EduardF1/portfolio/settings/branches
2. Click **Add branch ruleset** (the modern UI; the legacy
   "Branch protection rule" still works, both options below).
3. Branch name pattern: `main`.
4. **Require a pull request before merging**: leave OFF (solo dev).
5. **Require status checks to pass**: ON.
   - **Require branches to be up to date before merging**: ON.
   - Search and add: `lint · typecheck · unit · build` and
     `e2e (Playwright, Chromium)`. (They'll appear after the first
     CI run on a PR; until then the search box returns nothing.)
6. **Require conversation resolution before merging**: ON.
7. **Do not allow bypassing the above settings**: ON for non-admins;
   leave admin bypass enabled so Eduard can self-rescue.
8. **Restrict pushes that create matching branches** / **Lock
   branch**: leave OFF — the protection above is enough.
9. **Allow force pushes**: OFF.
10. **Allow deletions**: OFF.
11. Save.

## Order of operations

1. Push this branch (`feat/perf-coverage-and-a11y-hardening`).
2. Open a PR.
3. Let CI run end-to-end at least once so the status check names
   propagate to GitHub's "available checks" registry.
4. Apply the protection rule via Option A or Option B.
5. Merge the PR (rule will require its own checks to pass — fine,
   they will, that's the point).

## Notes for the PO

- The Lighthouse workflow added in this branch is intentionally
  `continue-on-error: true` — it should NOT be added to the
  required-checks list yet. Promote it once we've confirmed the score
  budgets hold across PRs for a couple of weeks.
- If you ever need an emergency hotfix and CI is down, `enforce_admins`
  is `false` so an admin can still push to `main` directly. That is
  intentional.
