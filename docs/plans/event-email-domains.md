# Event email-domain access

## Goal and constraints

Restrict shared-link admission to verified addresses from an organizer's exact domain allowlist.
An empty allowlist preserves existing behavior. Existing memberships and organizer-issued,
addressed invitations remain explicit exceptions. No approval queue or authentication upgrade.
No reservation or draw data enters this flow.

## Implementation

1. Add an event domain allowlist, validation, and an additive migration.
2. Reuse the access fields before event creation and in organizer-only event settings.
   Preserve the policy through anonymous drafts.
3. Enforce the current policy before shared-link membership or gift-list creation.
   Denials must not consume invitation uses. Explain restrictions before sign-in and
   offer an account switch when a signed-in address is ineligible.
4. Keep individual email invitations organizer-only and explicitly describe their exception.
   Prevent ordinary participants from adding accountless participants to restricted events.

## Verification

Domain validation and spoofed suffixes; unverified and wrong-domain joins; valid joins;
existing external members; live policy changes; settings authorization; anonymous drafts;
no membership, list, or token mutation on rejection. Run typecheck, lint, build, and the
release gate with a disposable database.

## Risk and rollback

Apply the migration before deploying the generated Prisma client. No existing event is
restricted automatically. Reverting the application leaves an unused additive column.
The restriction filters email domains; it does not select individuals within a company.
