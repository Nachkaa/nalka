# Christmas and consumer home

## Goal
- Lead the public homepage with Christmas among family and friends in November–December.
- Explain gifts, Secret Santa and shared preparations without event-management jargon.
- Give signed-in users a seasonal shortcut while keeping their events easy to reach.

## Constraints
- Reuse existing components, photography, seasonal detection and Christmas creation URL.
- Preserve authentication, membership, gift privacy and explicit module selection.
- Keep the public promise and creation examples consistent with a consumer audience.
- No new dependencies, schema changes or automatic module activation.

## Relevant files
- Public homepage, marketing sections, navbar and SEO description.
- Authenticated event home, event list and seasonal welcome card.
- Creation heading, type labels, title and location suggestions.

## Assumptions
- Consumer positioning is the current priority; professional features remain available.
- Existing November–December seasonal boundaries remain the product rule.

## Implementation
1. Replace the professional hero with a seasonal consumer entry and an evergreen fallback.
2. Lead with gifts, private draws and shared preparations; label preview content as an example.
3. Add a compact Christmas welcome to the authenticated home.
4. Align creation labels and suggestions without changing stored data or recommendations.

## Verification
- Typecheck, lint and production build.
- Existing seasonal/module recommendation regressions.
- Desktop/mobile browser review and Christmas CTA-to-creation flow.
- Check gift copy for spoiler-safe claims and absence of reservation identities.

## Rollback / risks
- Presentation-only changes can be reverted without a data migration.
- The existing seasonal helper determines when Christmas promotion appears.

## Validation results
- Typecheck passed; full lint returned no errors and one existing configuration warning.
- All 16 existing seasonal/module recommendation tests passed.
- Local HTTP checks passed for the public hero, Christmas CTA, preselected Christmas occasion,
  consumer creation labels, image alternatives and authenticated-home login guard.
- Server-render checks passed for the Christmas welcome and evergreen hero fallback.
- Browser visual review was unavailable because the cloud browser could not reach the local preview.
- No authenticated database session was used for an end-to-end home review.
