# Seasonal Secret Santa creation

## Goal and constraints

Make Christmas gift exchanges discoverable for families, friends and colleagues without forcing modules or changing the professional event flow. Secret Santa and personal gift lists remain independent, explicit choices. No schema, participation, access or reservation-privacy changes.

## Plan

1. Add a Christmas occasion, seasonal homepage entry and relevant title/location suggestions.
2. Recommend Secret Santa and personal lists from occasion/title/description or November–December event dates; never infer Christmas from a person's name or a venue.
3. Put the two independent gift options first in the module step and allow final adjustment in the review step. Preserve manual choices when navigating back.

## Verification

Recommendation regression cases cover seasonal dates, explicit Christmas/Secret Santa outside the season, ordinary events, and misleading names/venues. Run typecheck, lint and production build. Verify anonymous and authenticated creation retain the same form serialization and access controls.

## Risk and rollback

Suggestions never activate modules automatically. Revert the UI/recommendation changes independently of draw concurrency work. No migration required.
