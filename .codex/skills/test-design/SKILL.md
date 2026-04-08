---
name: test-design
description: Produce a focused Nalka test matrix for risky flows, fixes, or features.
---

# Test Design

## Name

`test-design`

## Description

Produce a focused test matrix for a change, flow, or bug-prone area.

## Use When

- A feature or fix needs clear test coverage before or after implementation.
- The area involves permissions, invites, memberships, or reservation secrecy.
- You need to separate must-cover cases from optional automation.

## Do Not Use When

- The request is to design the feature itself.
- The output needed is a code review or release checklist.
- The task is a tiny local style-only change.

Negative examples:
- "Should we keep this action server-side or move it client-side?"
- "List architecture options for event invite acceptance."

## Expected Inputs

- Feature, flow, or bug description
- Relevant routes, actions, or components
- Known risks
- Existing test coverage if known

## Expected Outputs

- Happy-path cases
- Edge cases
- Permission and auth cases
- Failure and recovery cases
- Regression risks
- Best automation targets

## Success Criteria

- The matrix is prioritized and actionable.
- Critical spoiler-leak and permission cases are included.
- Low-value test noise is excluded.

## Nalka Checklist

- Are there explicit cases for hidden reservation behavior and spoiler leaks?
- Are auth, invite acceptance, and event membership checks covered?
- Does the matrix emphasize the critical path instead of broad generic coverage?
