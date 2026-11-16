# Secret Santa overview status

## Goal and constraints

Show Secret Santa before general event details whenever the module is enabled. After a draw, display the signed-in participant's own recipient directly: name first, email fallback. The overview must never expose another giver's assignment, the full draw, or reservation ownership. Membership and module access are enforced on the server.

## Plan

1. Read global assignment and registered membership counts plus only the authorized giver's assignment in one consistent database snapshot.
2. Resolve only that recipient's name/email and return a display label, never the assignment record or a full mapping. Derive organizer capability from the authorized membership.
3. Display organizer setup / participant waiting / recipient name / joined-after-draw states. The Secret Santa link provides additional details; revealing the name requires no click. No draw or redraw from the overview.

## Verification

Regression tests cover denied/disabled access before reads, current-giver lookup, role-specific states, name/email fallback, no raw assignment data in props, and callers joining after a draw. Production smoke checks each person's own recipient in the initial HTML. Run typecheck, lint, build and release CI. Existing draw and reservation rules stay unchanged.

## Risk and rollback

No migration or stored state. Status refreshes when navigating/reloading; existing draw mutations already invalidate the event page. A person joining after a draw is told to contact the organizer; no automatic reassignment or notification occurs.
