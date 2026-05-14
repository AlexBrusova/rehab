# Railway Error Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Schedule a Claude Code agent that checks Railway logs every 4 hours and opens a PR with a code fix when it finds errors.

**Architecture:** Remote routine in Anthropic cloud. No code files added to the repo. Agent calls Railway GraphQL API for logs, Claude analyzes, GitHub API creates the fix branch + PR.

**Tech Stack:** Railway GraphQL API, GitHub REST API, Claude Code `/schedule` skill, curl (in agent environment)

---

## File Structure

No files created or modified in the repo. The schedule is configured entirely in Claude Code.

---

### Task 1: Get RAILWAY_TOKEN

**Files:** none

- [ ] **Step 1: Open Railway dashboard**

  Go to: `https://railway.com/account/tokens`

- [ ] **Step 2: Create token**

  Click "Create Token" → name it `claude-error-monitor` → copy the value immediately (shown once).

- [ ] **Step 3: Save token temporarily**

  Paste into a secure note. You will paste it into the `/schedule` prompt in Task 6. Do NOT commit it to git.

---

### Task 2: Get GitHub PAT

**Files:** none

- [ ] **Step 1: Open GitHub token settings**

  Go to: `https://github.com/settings/tokens?type=beta`

- [ ] **Step 2: Create fine-grained token**

  - Token name: `claude-error-monitor`
  - Repository access: `Only select repositories` → `AlexBrusova/rehab`
  - Permissions:
    - Contents: **Read and write** (create branches, push commits)
    - Pull requests: **Read and write** (open PRs)
    - Metadata: **Read** (required)

- [ ] **Step 3: Generate and copy token**

  Click "Generate token" → copy immediately (shown once). Save to the same secure note.

---

### Task 3: Verify Railway API Access

**Files:** none

- [ ] **Step 1: Test Railway GraphQL endpoint**

  Run in terminal (replace `YOUR_TOKEN`):

  ```bash
  curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ me { name email } }"}' | python3 -m json.tool
  ```

  Expected output:
  ```json
  {
    "data": {
      "me": {
        "name": "...",
        "email": "..."
      }
    }
  }
  ```

  If you see `"errors"` instead → token is wrong or expired. Regenerate in Task 1.

- [ ] **Step 2: Find the service ID for the backend**

  ```bash
  curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "query": "{ project(id: \"e90342bb-5a40-4032-adc0-a79fe0c3648a\") { services { edges { node { id name } } } } }"
    }' | python3 -m json.tool
  ```

  Note the `id` of the `backend` service — you will need it in Task 6.

---

### Task 4: Verify GitHub API Access

**Files:** none

- [ ] **Step 1: Test token can read the repo**

  ```bash
  curl -s -H "Authorization: Bearer YOUR_PAT" \
    https://api.github.com/repos/AlexBrusova/rehab \
    | python3 -m json.tool | grep '"full_name"'
  ```

  Expected:
  ```
  "full_name": "AlexBrusova/rehab",
  ```

- [ ] **Step 2: Test token can read branches**

  ```bash
  curl -s -H "Authorization: Bearer YOUR_PAT" \
    https://api.github.com/repos/AlexBrusova/rehab/branches \
    | python3 -m json.tool | grep '"name"'
  ```

  Expected: list including `"master"`. If 404 → token lacks repo access. Regenerate in Task 2.

---

### Task 5: Write the Agent Prompt

**Files:** none (this prompt will be pasted directly into `/schedule`)

The scheduled agent will receive this prompt every 4 hours. Copy the block below — replace `RAILWAY_TOKEN_VALUE`, `GITHUB_PAT_VALUE`, and `BACKEND_SERVICE_ID` with real values before pasting into Task 6.

```
You are a Railway error monitor for the rehab project.

## Your credentials (treat as secrets, never log them)
RAILWAY_TOKEN=RAILWAY_TOKEN_VALUE
GITHUB_PAT=GITHUB_PAT_VALUE
GITHUB_REPO=AlexBrusova/rehab
RAILWAY_PROJECT_ID=e90342bb-5a40-4032-adc0-a79fe0c3648a
RAILWAY_ENVIRONMENT_ID=8d3f28e4-ed41-4114-a857-1904e366c75d
RAILWAY_SERVICE_ID=BACKEND_SERVICE_ID

## Step 1 — Fetch latest deployment ID
Run:
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"{ environment(id: \\\"$RAILWAY_ENVIRONMENT_ID\\\") { deployments(first: 1) { edges { node { id status } } } } }\"}"

Extract the latest deployment ID from the response.

## Step 2 — Fetch logs
Run:
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"{ deploymentLogs(deploymentId: \\\"DEPLOYMENT_ID\\\", limit: 500) { timestamp message severity } }\"}"

## Step 3 — Analyze logs
Scan the log lines for any of:
- severity == ERROR or FATAL
- text containing Exception, NullPointerException, StackOverflow, OutOfMemory, Connection refused, Process exited with code 1

If NONE found → stop here, output "No errors found." and exit.

## Step 4 — Identify the broken file
Based on the stack trace or error message, determine which file in the Kotlin backend is responsible. Fetch it:

curl -s -H "Authorization: Bearer $GITHUB_PAT" \
  https://api.github.com/repos/$GITHUB_REPO/contents/backend/src/main/kotlin/com/rehabcenter/PATH_TO_FILE

Decode the base64 content field: echo "BASE64" | base64 -d

## Step 5 — Write the fix
Produce the minimal corrected version of the file. Fix only the bug. Do not refactor unrelated code.

## Step 6 — Create a fix branch
Get the SHA of master:
curl -s -H "Authorization: Bearer $GITHUB_PAT" \
  https://api.github.com/repos/$GITHUB_REPO/git/ref/heads/master | python3 -c "import sys,json; print(json.load(sys.stdin)['object']['sha'])"

Create branch fix/railway-error-$(date +%Y-%m-%d-%H):
curl -s -X POST -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/$GITHUB_REPO/git/refs \
  -d "{\"ref\":\"refs/heads/fix/railway-error-$(date +%Y-%m-%d-%H)\",\"sha\":\"MASTER_SHA\"}"

## Step 7 — Commit the fix
Get current file SHA:
curl -s -H "Authorization: Bearer $GITHUB_PAT" \
  https://api.github.com/repos/$GITHUB_REPO/contents/PATH_TO_FILE?ref=fix/railway-error-$(date +%Y-%m-%d-%H) \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])"

Push the fix (base64-encode the new file content first: base64 -i file.kt):
curl -s -X PUT -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/$GITHUB_REPO/contents/PATH_TO_FILE \
  -d "{\"message\":\"fix: auto-fix from Railway error monitor\",\"content\":\"BASE64_OF_FIXED_FILE\",\"sha\":\"FILE_SHA\",\"branch\":\"fix/railway-error-$(date +%Y-%m-%d-%H)\"}"

## Step 8 — Open PR
curl -s -X POST -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/$GITHUB_REPO/pulls \
  -d "{\"title\":\"fix(backend): <ERROR_SUMMARY> - auto\",\"body\":\"## Railway Error Detected\\n\\n**Error:**\\n\`\`\`\\nLOG_EXCERPT\\n\`\`\`\\n\\n**Fix applied:** EXPLANATION\\n\\n*Auto-generated by Railway error monitor*\",\"head\":\"fix/railway-error-$(date +%Y-%m-%d-%H)\",\"base\":\"master\"}"

Output the PR URL.
```

---

### Task 6: Create the Schedule

**Files:** none

- [ ] **Step 1: Open Claude Code**

  In this session or a new one.

- [ ] **Step 2: Invoke the schedule skill**

  Type:
  ```
  /schedule
  ```

- [ ] **Step 3: Configure the routine**

  When prompted:
  - **Name:** `railway-error-monitor`
  - **Schedule:** `0 */4 * * *` (every 4 hours)
  - **Prompt:** paste the full prompt from Task 5 (with real token values substituted)

- [ ] **Step 4: Confirm creation**

  The skill returns a routine ID. Save it:
  ```
  routine ID: <copy here>
  ```

---

### Task 7: Verify the Routine Runs

**Files:** none

- [ ] **Step 1: Trigger a manual test run**

  ```
  /schedule run railway-error-monitor
  ```

  Or via Claude Code UI: Schedules → railway-error-monitor → Run now.

- [ ] **Step 2: Watch output**

  Expected if no errors in Railway right now:
  ```
  No errors found.
  ```

  Expected if errors exist:
  ```
  Found ERROR: NullPointerException in PatientController...
  PR created: https://github.com/AlexBrusova/rehab/pull/XX
  ```

- [ ] **Step 3: If PR created — verify it**

  Open the PR URL, confirm:
  - Branch name matches `fix/railway-error-YYYY-MM-DD-HH`
  - Body contains the log excerpt
  - Changed file is correct
  - Fix is minimal and makes sense

- [ ] **Step 4: Confirm schedule is active**

  ```
  /schedule list
  ```

  Expected output includes `railway-error-monitor` with status `active` and next run time.

---

## Stopping the Agent (Reference)

```bash
/schedule list              # find the ID
/schedule delete <id>       # remove permanently
```
