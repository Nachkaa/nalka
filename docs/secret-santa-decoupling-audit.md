# Secret Santa Decoupling Audit

## 1) `EventGiftMode.NONE` / `EventGiftMode.SECRET_SANTA`

- Current references in `src`: 0

## 2) Gift list creation/sync triggered by Secret Santa state

- Removed from `src/app/(app)/event/[slug]/actions/gifts.ts`.
- Removed from `src/app/(app)/event/[slug]/edit/actions.ts`.
- Removed from `src/app/(app)/event/[slug]/actions/participants.ts`.
- Removed from Secret Santa draw action gating (now module-key based) in `src/app/(app)/event/[slug]/actions/secret-santa.ts`.

## 3) Secret Santa actions and UI entry points

- Server action: `src/app/(app)/event/[slug]/actions/secret-santa.ts` (`launchDraw`).
- UI module entry: `src/app/(app)/event/[slug]/_components/tabs/modules/SecretSantaModule.tsx`.
- UI section: `src/app/(app)/event/[slug]/_components/tabs/modules/secret-santa/SecretSantaSection.tsx`.
