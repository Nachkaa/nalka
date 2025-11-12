import { prisma } from "@/lib/prisma";
import type { Role } from "@/features/auth/roles";

export type Permission =
  | "event:close"
  | "member:kick"
  | "gift:create"
  | "gift:update"
  | "gift:delete";

const PERM_MIN_ROLE: Record<Permission, Role> = {
  "event:close": "ADMIN",
  "member:kick": "ADMIN",
  "gift:create": "MEMBER",
  "gift:update": "MEMBER",
  "gift:delete": "ADMIN",
};

// kept for future /admin page, not used in access decisions yet
export async function isPlatformAdmin(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!u?.isAdmin;
}

export async function getMyRole(eventId: string, userId: string) {
  const m = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

export async function can(userId: string, eventId: string, perm: Permission) {
  // no platform bypass yet
  const role = await getMyRole(eventId, userId);
  if (!role) return false;
  const need = PERM_MIN_ROLE[perm];
  return role === "OWNER" || (role === "ADMIN" && need !== "OWNER") || (role === "MEMBER" && need === "MEMBER");
}

/** Read access requires membership only. No platform bypass yet. */
export async function requireEventAccess(userId: string, eventId: string) {
  const role = await getMyRole(eventId, userId);
  if (!role) {
    const e = new Error("Interdit");
    // @ts-expect-error status for Next.js error handler
    e.status = 403;
    throw e;
  }
}

/** Throws 403 on failure */
export async function requireCan(userId: string, eventId: string, perm: Permission) {
  if (await can(userId, eventId, perm)) return;
  const e = new Error("Interdit");
  // @ts-expect-error status for Next.js error handler
  e.status = 403;
  throw e;
}
