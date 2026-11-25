# Budget: shared expenses for small groups

## Goal

Make /budget a shared-expense ledger for every event member: add an expense, split it equally among selected people, see personal advances and net balance, and record real reimbursements. No closure or upfront budget is required.

## Product decisions

- Primary action: Ajouter une dépense. Description and a positive EUR amount are required.
- Default payer and selected beneficiary: current user. One click selects the current group.
- Include accountless event participants. Freeze beneficiaries and cent-exact shares at purchase time; later arrivals/departures do not rewrite history.
- Personal summary and personal expenses first, with a shared chronological history. No ranking of other people's cumulative spending.
- Reimbursements are records of money already transferred, never payment initiation. Balances include reimbursements immediately; cancellation reverses their effect.
- Refresh the ledger automatically without navigating or resetting open forms.
- Preserve existing provider budgets at /budget/providers and existing lines/quotes routes. They remain organizer-only and outside the simple group flow.

## Architecture / invariants

- Four additive Prisma models: durable event participants, expenses, equal shares, repayments.
- Integer cents only; deterministic distribution of remainder cents; every expense's shares sum to its amount. Global balances always sum to zero.
- Net all expenses and repayments before proposing transfers. Exact minimum search for small groups, bounded to protect response latency; valid largest-first simplification for larger/harder cases. Never claim global optimality when the search was bounded.
- Membership and enabled BUDGET are enforced inside every query/mutation. Participant IDs must belong to this event.
- Serialize mutations on the event row, use idempotent UUID creation and version checks for edits. Repayment checks use balances under the same lock to reject double settlement.
- Soft deletion/cancellation preserves the ledger. Removing a membership or relative never removes financial history.
- Keep all gift and reservation data outside this feature.

## Verification

- Unit tests: unequal cent splits, subset beneficiaries, payer excluded, circular debts, greedy counterexample, exact minimum against exhaustive small cases, refunds/cancellations, random conservation.
- Database integration smoke: member visibility/write access, outsider and disabled-module denial, cross-event participant rejection, editable ownership, duplicate requests, concurrent stale edits and repayments, durable history, provider authorization.
- Prisma validate/generate, append-only migration, TypeScript, lint and build.
- Branch CI before fast-forward to protected main, then verify deployment and public release health.

## Migration / rollback

Add tables and relations only. Existing provider budget amounts and records are untouched. Existing legacy summary moves to /budget/providers; provider mutations retain their original organizer guard. Reverting the UI leaves new ledger records intact.
