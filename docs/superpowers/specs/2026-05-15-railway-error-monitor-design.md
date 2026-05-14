# Railway Error Monitor — Design Spec

**Date:** 2026-05-15  
**Status:** Approved  
**Author:** s.samusenko

## Problem

Runtime errors on Railway go unnoticed until manual inspection. No automated feedback loop between production logs and code fixes.

## Goal

A scheduled Claude Code agent checks Railway logs every 4 hours, detects errors, and opens a PR in the main repo with a minimal fix — without requiring human involvement to spot the issue.

## Approach

Claude Code `/schedule` — remote routine running in Anthropic cloud. No GitHub Actions, no separate ANTHROPIC_API_KEY required.

## Architecture

```
Every 4 hours (Anthropic cloud)
    ↓  RAILWAY_TOKEN → Railway GraphQL API → last 500 log lines
    ↓  Claude analyzes: finds ERROR / FATAL / process crash
If error found:
    ↓  GitHub API + GITHUB_PAT → reads relevant files from AlexBrusova/rehab
    ↓  Claude writes minimal fix
    ↓  GitHub API → creates branch fix/railway-error-YYYY-MM-DD-HH
    ↓  Opens PR targeting master in AlexBrusova/rehab
If quiet:
    ↓  exits silently, nothing created
```

## Error Detection Criteria

| Signal | Action |
|--------|--------|
| `ERROR` / `FATAL` in logs | Create fix PR |
| `Exception` / stack trace | Create fix PR |
| `Process exited with code 1` | Create fix PR |
| `WARN` / slow queries | Ignore (noise) |

## PR Format

- **Branch:** `fix/railway-error-YYYY-MM-DD-HH`
- **Title:** `fix(<module>): <error summary> - auto`
- **Body:** log excerpt + changed files + explanation of fix
- **Target:** `master` in `AlexBrusova/rehab`

## Railway Project

- **Project ID:** `e90342bb-5a40-4032-adc0-a79fe0c3648a`
- **Environment ID:** `8d3f28e4-ed41-4114-a857-1904e366c75d`

## Required Credentials (one-time setup)

| Secret | Where to get | Used for |
|--------|-------------|----------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens | Read logs via Railway GraphQL API |
| `GITHUB_PAT` | GitHub → Settings → Developer settings → Personal access tokens → scope: `repo` | Create branches + PRs in AlexBrusova/rehab |

## Stopping the Agent

```
/schedule list          # find agent ID
/schedule delete <id>   # stop permanently
```

Or: Claude Code UI → Schedules → Delete.

## Files Changed in Repo

None. The routine is configured entirely within Claude Code.

## Out of Scope

- Fixing infrastructure-level errors (Railway config, env vars) — agent only fixes code
- Auto-merging PRs — human review required before merge
- Slack/email notifications — not in this iteration
