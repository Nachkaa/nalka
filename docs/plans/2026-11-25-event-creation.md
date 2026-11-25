# Event creation: ski trip regression

## Goal

Create a signed-in event with a description longer than 500 characters and both date and location polls. Keep authentication, owner membership, module defaults, and gift privacy intact.

## Findings

- The creation textarea has no limit, while the server rejects descriptions over 500 characters with a generic error.
- The inline description editor already accepts 1000 characters; the basic editor still caps at 500.
- The creation action redirects inside a client try/catch. Return the created slug and navigate on success, following the existing anonymous-draft handoff.
- The former EXPENSES module was renamed BUDGET and is offered as Provider Cockpit. Its data model handles organizer/vendor budgets, not shared participant debts. Recovering a Tricount feature is not part of this fix.

## Implementation

1. Share title/description validation and limits between server and wizard, allowing 1000 description characters.
2. Show the limits and validate before submission without discarding the draft.
3. Return the successful creation result and navigate explicitly.
4. Align the basic editor so descriptions accepted at creation remain editable.

## Verification

- Reproduce the previous rejection using the ski description and five date / three location choices.
- Regression tests for text boundaries, no-gift events, and date/location poll modes.
- Typecheck, lint, production build, and existing relevant event tests.
- Extend the existing database smoke to persist a long description with both polls.

## Risks

No schema migration, permission, membership, or reservation change. Production behavior still needs confirmation after deployment; local tests cannot inspect the original failed request or its server logs.
