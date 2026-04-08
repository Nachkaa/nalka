---
name: release-check
description: Produce a short Nalka pre-release checklist for the highest-risk flows.
---

# Release Check

## Name

`release-check`

## Description

Produce a short pre-release checklist for the highest-risk flows in this repo.

## Use When

- Preparing to ship a feature, bugfix batch, or schema change.
- A release touches auth, invites, membership, reservations, or migrations.
- The team needs a concise go/no-go checklist.

## Do Not Use When

- The request is to review code line by line.
- The task is early discovery for a new feature.
- The output needed is a test matrix for one flow only.

Negative examples:
- "Find bugs in this PR."
- "Spec the reserve-gift flow."

## Expected Inputs

- Release scope
- Changed areas
- Migration or config changes if any
- Critical paths that must keep working

## Expected Outputs

- Checklist for auth and session flows
- Checklist for invites, membership, and permissions
- Checklist for hidden reservation behavior
- Checklist for migrations and rollback awareness
- Checklist for critical UX paths and analytics

## Success Criteria

- The checklist is short enough to run before release.
- It emphasizes real breakpoints for this product.
- It catches spoiler, auth, and permission regressions before ship.

## Nalka Checklist

- Are sign-in, invite redemption, and event membership flows still working end to end?
- Is reservation ownership still hidden across UI, data fetches, and analytics events?
- If Prisma or auth behavior changed, is the release and rollback path clear?
