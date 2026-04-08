---
name: bug-triage
description: Turn a Nalka bug report into a focused investigation path and minimal fix plan.
---

# Bug Triage

## Name

`bug-triage`

## Description

Turn a bug report into a practical investigation and minimal fix plan.

## Use When

- The bug is not yet reproduced or root-caused.
- Multiple layers may be involved: UI, server action, auth, Prisma, or routing.
- You need to narrow the search before changing code.

## Do Not Use When

- The fix is already obvious and local.
- The request is for post-implementation review.
- The output needed is release readiness.

Negative examples:
- "Review this merged diff for regressions."
- "Write acceptance criteria for anonymous invite redemption."

## Expected Inputs

- Bug report
- Observed behavior
- Expected behavior
- Repro steps, logs, and environment details if available

## Expected Outputs

- Reproduction hypotheses
- Likely root causes
- Files or modules to inspect
- Instrumentation ideas
- Minimal fix plan

## Success Criteria

- The next investigation step is obvious.
- The plan targets the likely invariant break, not just symptoms.
- Sensitive auth and spoiler paths are treated as first-class suspects when relevant.

## Nalka Checklist

- Could the bug come from mismatched event membership or invite state on the server?
- Could hidden reservation behavior be leaking through derived UI state or payloads?
- Does the fix plan target one clear invariant break instead of layering defensive patches?
