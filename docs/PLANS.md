# Planning Template

Use this before implementation when the task is ambiguous, cross-cutting, or risky. Keep it brief. Skip sections that are truly not needed.

## Goal

- What should change
- What should stay true

## Constraints

- Repo rules that matter here
- Auth, permission, invite, membership, or spoiler constraints
- Scope limits

## Relevant Files

- Routes, actions, components, helpers, schema, or tests likely involved

## Assumptions

- Facts being assumed so work can move forward

## Open Questions

- Unknowns that could change the approach
- Questions that must be resolved before coding

## Implementation Plan

1. Smallest safe change first
2. Follow-up changes needed to complete the flow
3. Guardrails to avoid regressions or spoiler leaks

## Verification Plan

- Target user flows to test
- Permission and auth checks to verify
- Smallest relevant commands:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - `pnpm build`

## Rollback / Risk Notes

- Main failure modes
- What can be reverted or isolated quickly
- Any migration, session, or hidden-reservation risk
