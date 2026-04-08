---
name: architecture-review
description: Evaluate implementation options and recommend the safest shape for a Nalka change.
---

# Architecture Review

## Name

`architecture-review`

## Description

Analyze a proposed change and return the safest implementation shape for this repo.

## Use When

- A feature can be implemented in more than one plausible way.
- A change crosses server/client boundaries, auth, Prisma, or route structure.
- You need options and trade-offs before editing code.

## Do Not Use When

- The request only needs a user-facing spec.
- The work is already implemented and needs review.
- The main need is reproducing a bug.

Negative examples:
- "Write acceptance criteria for gift reservation."
- "Why is this action returning 500 in prod?"

## Expected Inputs

- Proposed feature or change
- Relevant files, routes, or modules
- Constraints on data model, auth, or UX
- Known alternatives if any

## Expected Outputs

- Current pressure points
- 2-3 viable options
- Recommended option
- Trade-offs
- Risks
- Implementation guardrails

## Success Criteria

- The recommendation is concrete, not abstract.
- Risks to auth, membership, and spoiler protection are explicit.
- The output reduces rework before coding starts.

## Nalka Checklist

- Does the recommendation keep sensitive reservation logic on the server where possible?
- Are invite, membership, and permission boundaries enforced in the proposed shape?
- Does the option avoid broad abstractions when a route-local or feature-local solution is enough?
