# Secret Santa overview status

## Goal and constraints

Show the next useful Secret Santa action before the general event details whenever the module is enabled. The overview must never contain a recipient identity, the full draw, or reservation ownership. Membership and module access are enforced on the server.

## Plan

1. Read only the global assignment count, the signed-in giver's assignment count and registered membership count, using one consistent database snapshot.
2. Return a small status object, never an assignment record. Derive organizer capability from the authorized membership.
3. Display organizer setup / participant waiting / private attribution available / joined-after-draw states, linking to the existing protected Secret Santa route. No draw or redraw from the overview.

## Verification

Regression tests cover denied/disabled access before reads, role-specific states, count-only queries, no recipient data in props, and callers joining after a draw. Run typecheck, lint, build and release CI. Existing draw and reservation rules stay unchanged.

## Risk and rollback

No migration or stored state. Status refreshes when navigating/reloading; existing draw mutations already invalidate the event page. A person joining after a draw is told to contact the organizer; no automatic reassignment or notification occurs.
