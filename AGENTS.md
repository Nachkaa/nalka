# Nalka / Gift — Repository Instructions

## Product and codebase intent

Nalka is a minimal, secure event and gifting product.
The goal is not to become a generic “event platform”.
The goal is to make event coordination, gifting, and related flows simpler, clearer, and more reliable.

This repository uses:
- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Auth.js / NextAuth v5-style auth
- Tailwind CSS
- shadcn/ui

When making changes, optimize for:
1. clarity
2. reliability
3. minimal surface area
4. maintainability
5. good UX without feature bloat

---

## Working style

- Prefer small, focused diffs over broad rewrites.
- Do not rewrite large areas “for cleanliness” unless explicitly asked.
- Do not introduce abstractions before they are clearly needed in at least 2 real places.
- Do not add generic catch-all folders or frameworks inside the app.
- Preserve existing feature structure when possible.
- When a fix is possible with a local refactor, do not expand the scope.

If a task reveals broader structural issues:
- fix the requested issue first
- then note the structural issue separately
- do not silently refactor unrelated areas

---

## Architecture guardrails

- Use App Router patterns only.
- Do not introduce Pages Router patterns.
- Prefer Server Components by default.
- Use Client Components only for real interactivity, browser APIs, or local UI state.
- Keep server-only code out of client bundles.
- Keep the server/client boundary explicit and minimal.
- In `"use server"` files, export async server actions only.
- Shared constants, helpers, and types used by both client and server must live outside `"use server"` files.
- Do not create a generic global `actions/` folder. Keep actions close to the route or feature that owns them.
- Prefer colocated feature folders over horizontal utility sprawl.

---

## TypeScript rules

- Keep strict TypeScript.
- Do not use `any` unless absolutely unavoidable.
- Prefer explicit local types over broad shared types when the scope is small.
- Prefer narrowing and derived types over type assertions.
- Avoid `as unknown as ...`.
- If a type is painful, first check whether the code structure is wrong.
- Remove dead props, dead state, dead variables, and dead branches instead of typing around them.

---

## React and state rules

- Do not use `useEffect` to mirror props into state unless there is no better option.
- Prefer derived values over duplicated state.
- Avoid synchronous `setState` inside effects when the value can be computed directly.
- Do not create components during render.
- Avoid unnecessary `useMemo` / `useCallback`.
- Keep forms predictable and local.
- Prefer controlled flows when validation and mutation matter.
- Avoid cascading renders caused by state synchronization patterns.

---

## Next.js rules

- Use the latest stable Next.js patterns already adopted by the repo.
- Prefer route-local loading, error, and action handling.
- Use `revalidatePath` or cache invalidation only where it is actually needed.
- Do not move logic client-side if it can safely stay server-side.
- Do not expose server internals to the client for convenience.
- Use `next/image` when appropriate for user-facing images unless there is a deliberate reason not to.

---

## Prisma and database rules

- Treat migration history as append-only once shared.
- Never edit old applied migration SQL unless explicitly doing a controlled recovery.
- Schema change = Prisma migration.
- Do not “fix” drift by hand-editing `_prisma_migrations`.
- Do not delete migration folders casually.
- Prefer clear migration names that describe business intent.
- Keep `schema.prisma` aligned with actual product rules, not temporary hacks.
- If a data model change weakens or removes uniqueness, revisit all `upsert` logic that depended on the old unique key.
- When changing Prisma relations or constraints, verify both the generated client API and the application logic.

---

## Auth and permissions rules

- Authorization must be enforced server-side.
- Do not trust client-provided role or ownership information.
- Check event membership / role on the server before mutating protected resources.
- Prefer explicit permission helpers when the same rule repeats.
- Do not weaken authorization to simplify UI flows.

---

## UX and product rules

- Prefer fewer, clearer actions over crowded UI.
- Default to accessibility-safe behavior and semantic HTML.
- Do not add friction unless it protects data integrity or avoids user confusion.
- Make empty states, disabled states, and pending states explicit.
- Preserve current product direction: lightweight event coordination with modular capabilities.
- Do not expand features into a generic event-enterprise product unless explicitly asked.
- Challenge UX complexity when a simpler flow would solve the same problem.

---

## Styling and UI rules

- Use existing design tokens, spacing, and component patterns.
- Prefer shadcn/ui primitives already present in the repo.
- Do not introduce a second design system.
- Keep UI visually calm and compact.
- Avoid over-animating.
- Maintain responsive behavior without building separate desktop/mobile codepaths unless necessary.

---

## File and module organization

- Keep feature logic close to the feature.
- Shared helpers should be genuinely shared, not prematurely centralized.
- Keep domain logic out of presentational components when it starts to grow.
- Avoid “utils” dumping grounds.
- Name files by responsibility, not vague convenience.

---

## Fixing bugs

When fixing a bug:
1. identify the real invariant that is being violated
2. fix the smallest layer that correctly restores that invariant
3. avoid patching symptoms in multiple places unless necessary
4. run the relevant checks after the change

Do not silence lint or type errors unless the rule is genuinely wrong for this case.

---

## Verification commands

After meaningful code changes, run the smallest relevant checks first.

Preferred order:
1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build`

For Prisma changes:
1. verify `schema.prisma`
2. run the appropriate Prisma migration command
3. regenerate Prisma client if needed
4. re-run typecheck/build

Do not claim a fix is complete without running checks when the environment allows it.

---

## Output expectations for code changes

When making changes:
- state the intent briefly
- change only the necessary files
- keep naming precise
- summarize what changed and why
- mention any remaining risk or follow-up only if it is real

Do not produce long essays when a precise patch is enough.

---

## Escalation rule

Stop and ask before:
- adding a new dependency
- changing authentication/session behavior
- changing database semantics in a destructive way
- introducing a new cross-cutting pattern
- performing a migration/history rewrite that affects shared environments

For local-only cleanup or obvious lint/type/build fixes, proceed directly.

---

## What to optimize for

Good changes in this repo usually look like this:
- smaller
- clearer
- safer
- more local
- more typed
- easier to review
- aligned with current product direction

Bad changes usually look like this:
- bigger than needed
- abstract for no reason
- client-heavy without benefit
- hidden behavior changes
- migration/history hacks
- generic architecture for imaginary future needs