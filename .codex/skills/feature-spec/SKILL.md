---
name: feature-spec
description: Turn a rough feature idea into a concise implementation-ready spec for Nalka.
---

# Feature Spec

## Name

`feature-spec`

## Description

Turn a rough feature idea into a concise implementation-ready spec for this repo.

## Use When

- A request is still fuzzy and needs clear scope before coding.
- The team needs UX states, rules, and acceptance criteria in one short artifact.
- A feature touches invites, permissions, membership, or hidden reservation behavior.

## Do Not Use When

- The task is already a narrow code fix with known files.
- The request is asking for architecture options rather than a single scoped spec.
- The output needed is a test matrix or code review.

Negative examples:
- "Rename this button and fix spacing."
- "Review this diff for auth leaks."

## Expected Inputs

- Feature idea or problem statement
- Target user or event flow
- Known constraints or non-negotiable business rules
- Existing screens, routes, or data involved if known

## Expected Outputs

- Goal
- Scope
- User flows and UX states
- Business rules
- Edge cases
- Acceptance criteria
- Out of scope

## Success Criteria

- The spec is short enough to implement from directly.
- Hidden reservation and permission risks are called out when relevant.
- Scope is explicit enough to prevent feature creep.

## Nalka Checklist

- Does the spec keep reservation ownership hidden at every UI state?
- Are event membership and invite rules explicit where access depends on them?
- Is out-of-scope defined tightly enough to avoid generic event-platform creep?
