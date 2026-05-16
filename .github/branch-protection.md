# Branch Protection Setup for `master`

This document explains how to enforce the `backend-ci` status check before merging to `master`.

> **Prerequisite:** The CI workflow must run at least once on the repository before the
> `backend-ci` status check name appears in the GitHub UI dropdown. Push or open a PR
> against `master` to trigger the first run.

---

## Option 1 — GitHub UI

1. Go to your repository on GitHub.
2. Click **Settings** → **Branches** (in the left sidebar under "Code and automation").
3. Under **Branch protection rules**, click **Add rule**.
4. In **Branch name pattern**, type `master`.
5. Enable the following options:
   - **Require a pull request before merging**
     - Check **Require approvals** (1 reviewer recommended).
   - **Require status checks to pass before merging**
     - Check **Require branches to be up to date before merging**.
     - In the search box, type `backend-ci` and select it from the dropdown
       (appears only after the workflow has run at least once).
   - **Do not allow bypassing the above settings** — enable this to prevent admins from bypassing.
   - **Restrict who can push to matching branches** — add only the required teams/users if desired.
6. Click **Create** (or **Save changes**).

---

## Option 2 — GitHub CLI (`gh api`)

Run the command below as a repository admin. Replace `OWNER` and `REPO` with the actual values.

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/branches/master/protection \
  --input - << 'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["backend-ci"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
JSON
```

### What each field does

| Field | Effect |
|---|---|
| `required_status_checks.strict: true` | Branch must be up to date with `master` before merge |
| `required_status_checks.contexts` | Only `backend-ci` job must pass |
| `enforce_admins: true` | Admins cannot bypass the rules |
| `required_pull_request_reviews` | At least 1 approval required |
| `restrictions: null` | All users with push access can open PRs |

---

## Verifying the rule is active

```bash
gh api /repos/OWNER/REPO/branches/master/protection \
  --jq '.required_status_checks.contexts'
# Expected output: ["backend-ci"]
```
