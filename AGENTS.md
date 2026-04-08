# Nalka Repo Contract

## Stack
- Next.js App Router
- TypeScript strict
- Prisma + PostgreSQL
- Auth.js / NextAuth
- Tailwind CSS + shadcn/ui

## Important Paths
- `src/app/`: routes and route-local server actions
- `src/features/`: feature-local UI, domain logic, and helpers
- `src/app/(app)/event/[slug]/`: event-scoped flows, permissions, and gift interactions
- `src/app/login/` and auth-related route groups: session and sign-in flows
- `src/components/ui/`: shared shadcn/ui primitives
- `src/lib/`: shared technical helpers only
- `prisma/schema.prisma`: source of truth for the data model
- `prisma/migrations/`: append-only migration history
- `docs/PLANS.md`: lightweight planning template for risky or ambiguous work

## Repo Constraints
- Keep diffs small, local, and reviewable.
- Use App Router patterns only. No Pages Router.
- Prefer Server Components. Use client components only for real interactivity.
- Keep server and client boundaries explicit.
- Keep actions close to the owning route or feature. No generic global `actions/` folder.
- Favor simple secure paths over abstraction.
- Auth, invites, permissions, and event membership are critical risk areas.
- Never expose who reserved what in UI, API responses, logs, analytics payloads, or derived states.

## Workflow
- For ambiguous, cross-cutting, or risky tasks, start from `docs/PLANS.md` before implementation.
- Change the smallest layer that restores the invariant instead of patching symptoms in multiple places.
- When touching auth, membership, invites, or reservations, inspect both server enforcement and user-visible states.
- Keep server actions, loaders, and mutations close to the route or feature that owns them.
- Update a skill only when the rule is reusable across future tasks.
- For repeated mistakes, update this file or the relevant skill instead of repeating prompt instructions manually.

## Coding Conventions
- Use current repo patterns, not deprecated Next.js or Auth.js APIs.
- Keep strict typing. Avoid `any`, broad assertions, and dead code.
- Prefer feature-local types and helpers unless reuse is real.
- Enforce authorization server-side. Never trust client-provided role or ownership data.
- Keep business rules out of presentational components once logic starts to grow.
- Include explicit empty, loading, error, disabled, and success states for user-facing flows.

## Verification
Run the smallest relevant checks after meaningful changes:
1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build`

For Prisma changes:
1. update `prisma/schema.prisma`
2. create a migration
3. regenerate Prisma client if needed
4. rerun relevant verification

## Definition Of Done
- The invariant behind the change is clear and preserved.
- The diff is minimal and fits current architecture.
- Auth, permission, and spoiler risks were checked.
- Relevant verification ran, or the missing verification is stated explicitly.
- Remaining risk or follow-up is brief and concrete.

## Anti-Patterns
- Broad cleanup unrelated to the task
- Generic abstractions for imagined future reuse
- Client-side permission checks as source of truth
- Global helpers that should stay event-local or feature-local
- Hidden behavior changes inside refactors
- Migration history edits
- UI or analytics that can reveal reservation ownership
