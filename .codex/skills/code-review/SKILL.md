---
name: code-review
description: Review Nalka changes for correctness, security, spoiler safety, and repo fit.
---

# Code Review

## Name

`code-review`

## Description

Review a diff or file set for correctness, security, and repo fit.

## Use When

- Reviewing a change before merge.
- Auditing a sensitive area such as auth, invites, or reservation flows.
- Checking whether a diff fits the repo contract without rewriting it.

## Do Not Use When

- The main need is to plan a new feature.
- The issue is an active bug without a known repro.
- The output needed is a release checklist.

Negative examples:
- "Turn this wishlist idea into a spec."
- "Generate a test matrix for invite acceptance."

## Expected Inputs

- Diff, commit, PR, or file list
- Intended behavior
- Known risky areas or regressions to watch

## Expected Outputs

- Findings ordered by severity
- Why each finding matters
- Missing tests or verification gaps
- Open questions or assumptions if needed

## Success Criteria

- Findings focus on real risk, not style trivia.
- Auth leaks, spoiler leaks, and architecture mismatches are surfaced.
- If no findings exist, that is stated plainly with any residual risk.

## Nalka Checklist

- Can the change reveal who reserved what through UI, logs, analytics, or response shape?
- Are server-side auth, membership, and permission checks still the real source of truth?
- Does the diff stay local and aligned with App Router and feature-local patterns?
