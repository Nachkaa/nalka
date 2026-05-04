# Nalka B2B Transition Audit

## Executive verdict

- **B2B-ready?** Not yet. The product has credible B2B raw material, especially Budget, vendors, quotes, programme, RSVP, polls, and organizer-only access, but the public story and default flows still read as a private-event gift app.
- **Main positioning problem:** Nalka currently presents itself as "evenements prives + cadeaux + Secret Santa". The professional planning modules exist, but they are secondary to family/social language, gift mechanics, and playful surfaces.
- **Biggest product opportunity:** Reposition Nalka as a lightweight event operations workspace: brief, attendees, programme, decisions, vendor sourcing, quotes, budget, and payment follow-up in one event-scoped hub.
- **Do not touch yet:** Do not rewrite roles, create a generic SaaS workspace model, build full CRM/procurement, add native file storage, or turn Budget into Tricount-style shared expenses. Keep the event-scoped architecture and validate the B2B wedge first.

## Current product reading

From the codebase, Nalka currently appears to be a modular private event organizer. The strongest public signals are birthday, Christmas, family, friends, gifts, Secret Santa, potluck, and spoiler-safe reservations. This is visible in `src/app/page.tsx`, `src/app/(app)/_components/*`, `src/components/forms/EventForm.tsx`, the event creation theme step, release notes, and module labels.

Inside the app, the product is more mature than the marketing suggests. The event shell has route-local modules, organizer/member roles, RSVP, participants, polls, programme, gifts, potluck, and an increasingly professional Budget module with event-scoped vendors, quotes, selected quotes, payment entries, and organizer-only access.

The mismatch is sharp: the app can already support an organizer planning a paid event, but the first impression still says "small private group coordinating gifts".

## B2B target direction

The clearest B2B positioning based on the current product is:

> Nalka is a lightweight event operations workspace for organizers who need to coordinate decisions, attendees, programme, vendors, quotes, and budget without exposing sensitive details to the wrong people.

This is strongest for agencies, internal event teams, venues, office managers, and freelance planners running small to mid-size events. The immediate wedge should be **event decision support + vendor/budget follow-up**, not enterprise event management.

Recommended narrative:*-+ *
- "One event hub for programme, RSVP, polls, vendor quotes, and payments."
- "Private by default: attendees see what they need, organizers keep sensitive planning data separate."

## Module-by-module audit

| Module | Current role | B2B relevance | Problem | Recommendation | Priority |
|---|---|---|---|---|---|
| Budget / Expenses | Organizer-only financial workspace with budget, lines, quotes, vendors, selected quote, payments | High | Strong B2B module but still called inconsistently in some places as expenses/depenses; no client/share view; some finance reversibility and lifecycle gaps documented in budget audit | Keep and make primary B2B anchor. Position as "Budget & prestataires" or "Budget" with Devis inside | P0 |
| Quotes / Vendors | Embedded inside Budget via `Vendor`, `Quote`, `QuoteAttachment` | High | Hidden under Budget route; no standalone vendor story; event-scoped vendors only | Keep inside Budget for now. Surface in copy as "devis et prestataires" without creating a separate CRM | P0 |
| Timeline / Programme | Event programme with moments, schedule dependency, live summary | High | Label "Programme" is good, but suggestions and copy still lean "journee" and social events | Keep as primary B2B module. Reposition as "Programme" / "Run of show" in sales demo copy | P0 |
| RSVP / Guests | Event members with RSVP statuses and participant panels | High | "Invites", "participants", and private-event phrasing are okay for B2C but weak for client/team operations; roles are coarse | Rename/reposition as "Participants" or "Invites & RSVP". Keep minimal | P0 |
| Polls | Date/location decision polls | Medium-high | Good for decision support, but current wording is "decider ensemble" and limited to schedule/location | Keep and reposition as "Decisions" in B2B copy. Do not expand poll types yet | P1 |
| Potluck | "Qui ramene quoi" shared food/gear list | Medium in internal/team events, low in agency/vendor planning | Name and icon are consumer/social; useful only in context like team offsite supplies or internal events | Hide behind context. Rename to "Contributions" or "Materiel & apports" for professional templates | P1 |
| Gifts | Spoiler-safe gift lists and reservations | Low for default B2B, medium for hospitality/client gifting | Strong confidentiality implementation, but gift framing dominates the product and pulls it B2C | Remove from primary B2B experience. Keep contextual for gifting, rewards, or private events | P0 |
| Secret Santa | Private assignment gift exchange | Low | Strongly seasonal/family/social; playful and not credible as a default professional module | Deprioritize. Hide behind "internal team rituals" context only | P0 |
| Chat | Coming soon module | Low until implemented | Placeholder can make product look unfinished | Keep hidden or clearly "not in demo". Do not build yet | P0 |

## UX and copy issues

| Current issue | Why it hurts B2B credibility | Suggested replacement |
|---|---|---|
| Homepage metadata: "Organisation d'evenements prives et listes cadeaux" | Frames Nalka as consumer/private/gift-first | "Plateforme legere de pilotage evenementiel" |
| Hero H1: "Creez un evenement prive en toute simplicite" | Too private-event generic; not professional | "Pilotez vos evenements, devis et decisions au meme endroit" |
| CTA: "Creer votre evenement" | Acceptable, but not demo/sales oriented | "Creer un espace evenement" |
| Marketing quick link: "modules cadeaux, Secret Santa et depenses" | Leads with B2C modules before the B2B anchor | "modules programme, RSVP, budget et devis" |
| Mock event: "Anniversaire d'Emma", "Cadeaux", "8 reserves" | Strong family/private signal | Use "Seminaire Q3", "Devis", "3 en attente", "Budget engage" |
| Use cases: Anniversaire, Noel, Couple | Directly contradicts B2B target | Replace with "Seminaire interne", "Lancement client", "Soiree partenaire" |
| Event creation StepType: Social, Famille, Sport, Voyage, Groupe / asso | Only "Groupe / asso" and maybe Voyage fit B2B | "Corporate", "Agence", "Lieu / venue", "Association", "Equipe interne", "Sur-mesure" |
| StepType prompt: "Pourquoi crees-tu cet evenement ?" | Informal second-person singular | "Quel type d'evenement organisez-vous ?" |
| StepModules title "Options" | Too vague for professional setup | "Modules de pilotage" |
| "Qui ramene quoi" / Potluck | Casual domestic phrasing | "Contributions" or "Materiel & apports" |
| Overview "Astuce : cliquez sur un widget..." | Tutorial tone, low value | Remove, or replace with no visible tip |
| WhatsNext "Ajouter quelques details" / "ambiance" | Social event vocabulary | "Completer le brief" / "Ajoutez les informations utiles aux participants" |
| Event list empty state: "organiser vos cadeaux sans spoilers" | Makes first dashboard gift-first | "Creer un premier espace pour centraliser participants, programme et budget" |
| Module manager placeholder "Configuration en cours de construction" | Demo credibility problem | Hide config for modules without settings, or show stable "Aucun parametre disponible" |
| Secret Santa copy "Tu offres un cadeau a" | Informal and clearly non-B2B | Keep only in internal team ritual context |

## Navigation and flow recommendations

Minimal changes to make the app feel professional:

1. Make the primary authenticated dashboard read "Evenements" or "Espaces evenement" instead of "Mes evenements" if the target is teams/agencies.
2. In event creation, make professional event types the default suggestions and move family/social presets out of the first screen.
3. Reorder module discovery and nav for B2B demos: Overview, Participants/RSVP, Programme, Decisions/Polls, Budget, Devis/Prestataires if surfaced, then contextual modules.
4. Keep Gifts, Secret Santa, and Potluck off the default B2B module set. They should appear only when the event type implies them.
5. Rename Budget local navigation only if necessary: "Vue d'ensemble", "Postes", "Devis" is already solid.
6. Hide `Chat` from demos while it is coming soon.
7. Replace marketing examples with concrete professional event scenarios using existing modules, not generic SaaS feature blocks.
8. Keep the event-scoped IA. Do not introduce organizations/workspaces until a real B2B account model is validated.

## Data and permissions risks

- `EventMemberRole` only has `OWNER`, `ADMIN`, `MEMBER`. This works for private events, but B2B will need at least a read-only budget/client view eventually. Do not add full RBAC yet; start with module-specific visibility policy when the need is real.
- Budget access is organizer-only via `requireEnabledModule(... requireOrganizer: true)`. Good for confidentiality, but it blocks client/commanditaire review flows.
- Internal notes on `BudgetLine` and `Quote` are visible to all organizers. If a client is ever made `ADMIN`, they can see sensitive notes.
- `Event` hard deletes cascade through Budget, vendors, quotes, payments, gifts, polls, and timeline. B2B usage needs archive/export safeguards before broad rollout.
- `Vendor` is event-scoped. This is safe and simple, but agencies will eventually expect reusable vendors across events.
- `QuoteAttachment.fileUrl` stores external URLs. This is pragmatic, but B2B confidentiality depends on external sharing settings and server-side URL validation.
- Gift reservation mapping correctly hides reservation state on own list when no-spoil is enabled and hides reserver identity when anonymous reservations are enabled. Preserve this invariant; do not surface reservation ownership in B2B analytics or dashboards.
- `SecretSantaAssignment` has event/giver uniqueness but no explicit relation to `EventMember`; ensure assignment queries remain membership-gated.
- Invite tokens and link joins are appropriate for lightweight B2B demos, but access expiry, revoked links, and auditability will matter before selling to stricter companies.
- `memberLimit` default 50 may be low for some professional events, but raising it should wait until performance and attendee-management needs are validated.

## Technical architecture risks

- Public positioning and authenticated product have diverged. This is a product architecture risk: B2B modules exist but are not the default story.
- Budget is the B2B core, but its lifecycle depends on module activation and budget existence. The prior audit flags missing/fragile auto-creation as a demo risk.
- Module registry is a good extension point, but `defaultEnabledOnCreate` is false for all business-relevant modules except Overview. B2B onboarding needs event-type-based defaults, not a rewrite.
- Permissions are split across `features/events/access.ts`, `features/events/acl.ts`, `server/permissions.ts`, and feature-local checks. This is manageable now but should not fragment further.
- Some route-local actions live under `src/app/(app)/event/[slug]/actions`, while Budget uses feature-local server mutations. Both patterns fit the repo, but new B2B features should stay feature-local or route-local, not in a global actions folder.
- Marketing components and older home components coexist. This increases copy drift and makes repositioning incomplete unless all public surfaces are audited together.
- No cross-event dashboard exists. That is not a blocker for a POC, but it limits the agency story beyond one event at a time.
- The app has a debug route `src/app/api/debug/my-events/route.ts`; this should not be present in a sales/demo environment.

## Recommended roadmap

### Phase 1 — Positioning cleanup

Small changes, high impact:

- Rewrite homepage metadata, hero, module section, privacy framing, and examples around professional event operations.
- Change event creation presets from family/social to professional scenarios.
- Reorder and relabel module recommendations so Budget, Programme, RSVP, and Polls are the professional default.
- Hide Gifts, Secret Santa, Potluck, and Chat from the primary B2B demo path unless context requires them.
- Replace weak empty states and informal copy in event list, overview, and module manager.

### Phase 2 — Demo-ready B2B experience

Changes needed for a credible sales conversation:

- Make Budget activation reliable and demo-safe.
- Use one demo scenario: "Seminaire client", "Lancement produit", or "Soiree partenaire".
- Prepare a populated demo event with participants, programme, open decision poll, budget lines, vendors, quotes, selected quote, and upcoming payments.
- Add/prepare a read-only client export or static presentation view before building interactive client access.
- Remove unfinished placeholders from the demo path.
- Keep confidentiality story explicit: attendees see public event information; organizers keep budget, notes, and quote decisions private.

### Phase 3 — Real B2B product depth

Wait until the direction is validated:

- Organization/account model.
- Reusable vendor directory across events.
- Budget viewer/client access with expiration and hidden internal notes.
- Cross-event agency dashboard.
- Audit logs beyond payment state changes.
- PDF/CSV exports with professional branding.
- Attachment storage and document permissions.
- Expanded decision workflows beyond date/location polls.

## Top 10 concrete actions

1. **Reposition public homepage**
   - Files likely involved: `src/app/page.tsx`, `src/app/(app)/_components/MarketingModulesSection.tsx`, `MarketingExamplesSection.tsx`, `MarketingPreviewSection.tsx`, `MarketingPrivacySection.tsx`, `src/lib/seo.ts`
   - Business reason: First impression must match B2B sales target.
   - UX reason: Users should understand Nalka as an event operations tool before seeing gift modules.
   - Technical risk: Low; copy and ordering only.
   - Estimated complexity: S

2. **Replace event creation types with professional presets**
   - Files likely involved: `src/app/(app)/event/new/_components/steps/StepType.tsx`, `moduleRecommendations.ts`, `titleSuggestions.ts`
   - Business reason: Creates a professional default path.
   - UX reason: Organizer sees relevant choices immediately.
   - Technical risk: Low-medium; recommendations affect default modules.
   - Estimated complexity: S

3. **Make B2B module ordering explicit**
   - Files likely involved: `src/features/events/module-registry.ts`, `src/features/events/shell-navigation.ts`, `src/app/(app)/event/[slug]/_components/shell/ModuleManagerDialog.tsx`
   - Business reason: Budget, Programme, RSVP, and Decisions should lead the story.
   - UX reason: Reduces noise from gifts and seasonal modules.
   - Technical risk: Low; preserve module keys and routes.
   - Estimated complexity: S

4. **Rename/reposition Potluck for professional contexts**
   - Files likely involved: `src/features/events/module-registry.ts`, `src/features/potluck/components/*`, `src/app/(app)/event/new/_components/steps/StepModules.tsx`
   - Business reason: "Potluck" weakens agency/corporate credibility.
   - UX reason: "Contributions" or "Materiel & apports" still covers supplies without domestic tone.
   - Technical risk: Low if label-only; medium if route/model names change. Avoid route/model rename for now.
   - Estimated complexity: XS/S

5. **Move Gifts and Secret Santa out of the primary B2B path**
   - Files likely involved: `StepModules.tsx`, `moduleRecommendations.ts`, marketing sections, `module-registry.ts`
   - Business reason: These modules dilute the professional value proposition.
   - UX reason: B2B prospects should not have to mentally ignore consumer features.
   - Technical risk: Low if contextual hiding only; high if removing modules. Do not remove.
   - Estimated complexity: S

6. **Stabilize Budget demo flow**
   - Files likely involved: `src/features/events/server/module-manager.ts`, `src/features/budget/server/queries/_shared.ts`, `src/features/budget/server/get-budget-route-context.ts`
   - Business reason: Budget is the strongest B2B proof point.
   - UX reason: No prospect should hit `notFound()` after enabling Budget.
   - Technical risk: Medium; touches module activation and data lifecycle.
   - Estimated complexity: S

7. **Remove unfinished module-manager placeholders from demo path**
   - Files likely involved: `ModuleManagerDialog.tsx`
   - Business reason: "in construction" copy undermines trust.
   - UX reason: Empty config panels create dead ends.
   - Technical risk: Low.
   - Estimated complexity: XS

8. **Clarify Budget confidentiality and client boundaries**
   - Files likely involved: `src/features/budget/lib/constants.ts`, Budget screens, future docs/demo copy
   - Business reason: B2B buyers care about who sees budget, quotes, and notes.
   - UX reason: Organizers need confidence that participants do not see internal data.
   - Technical risk: Low for copy; medium if permissions are changed.
   - Estimated complexity: XS

9. **Prepare one professional demo event**
   - Files likely involved: `prisma/seed.ts` or a separate local demo seed if created later
   - Business reason: Sales-readiness depends on showing a realistic workflow, not blank modules.
   - UX reason: Demonstrates the event hub in under five minutes.
   - Technical risk: Low if kept local/demo-only.
   - Estimated complexity: S

10. **Document a minimal B2B permission stance before changing roles**
    - Files likely involved: `docs/PLANS.md` or a focused audit/spec doc; later `prisma/schema.prisma`, `src/features/events/access.ts`
    - Business reason: Prevents accidental client access to internal notes or gift reservation data.
    - UX reason: Clear expectations for organizers, clients, and attendees.
    - Technical risk: Medium-high if rushed into schema/RBAC.
    - Estimated complexity: S for spec, M/L for implementation later

## Things to avoid

- Do not build a full organization/workspace/account hierarchy before a paid B2B workflow is validated.
- Do not turn Budget into shared-expense settlement. The current B2B Budget module is vendor/quote/payment tracking.
- Do not remove Gifts or Secret Santa from the codebase; just keep them contextual and out of the professional default.
- Do not expose gift reservation ownership in dashboards, analytics, exports, logs, or participant summaries.
- Do not make clients `ADMIN` just to let them view budget data. That exposes internal notes and broad event controls.
- Do not add generic CRM/vendor management until event-scoped vendor workflows show repeated demand.
- Do not build native attachment storage before validating whether external links are enough for a POC.
- Do not over-polish consumer modules while the B2B story still points to Budget, Programme, RSVP, and Decisions.
- Do not add broad global helpers or generic actions. Keep changes route-local or feature-local.
- Do not demo unfinished modules like Chat or config placeholders.
