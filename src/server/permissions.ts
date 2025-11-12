import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export class HttpError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code); this.status = status; this.code = code;
  }
}

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new HttpError(401, "UNAUTHENTICATED", "Utilisateur non connecté");
  return { userId };
}

export async function requireMemberOnEvent(eventId: string) {
  const { userId } = await requireUser();
  const m = await prisma.membership.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });
  if (!m) throw new HttpError(404, "NOT_MEMBER", "Membre introuvable");
  return { userId, role: m.role };
}

export async function requireAdminOnEvent(eventId: string) {
  const { userId, role } = await requireMemberOnEvent(eventId);
  if (role !== "admin") throw new HttpError(403, "NOT_AUTHORIZED", "Admin requis");
  return { userId };
}

export async function requireAdminOnList(listId: string) {
  const list = await prisma.giftList.findUnique({ where: { id: listId }, select: { eventId: true } });
  if (!list) throw new HttpError(404, "LIST_NOT_FOUND", "Liste introuvable");
  return requireAdminOnEvent(list.eventId);
}
