// app/(app)/event/[slug]/actions/participants.ts

"use server";

import { auth, signIn } from "@/auth";
import {
  deleteGiftListsForMember,
  deleteGiftListsForRelative,
  ensureGiftListForJoinedMember,
} from "@/features/gifts/server/lifecycle";
import { prisma } from "@/lib/prisma";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";
import { EventGiftMode, EventMemberRole as ROLE, EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().min(1),
  email: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inviter un membre
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function inviteMember(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const { eventId, email } = schema.parse({
    eventId: String(formData.get("eventId") || ""),
    email: String(formData.get("email") || ""),
  });

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!me) throw new Error("User not found");

  // Rate limits
  const ip = await getClientIp();
  await limit({ key: `invite:ip:${ip}`, max: 60, windowMs: 60 * 60_000 });
  await limit({ key: `invite:user:${me.id}`, max: 200, windowMs: 24 * 60 * 60_000 });
  await limit({ key: `invite:event:${eventId}`, max: 500, windowMs: 24 * 60 * 60_000 });
  await limit({ key: `invite:target:${email}`, max: 3, windowMs: 24 * 60 * 60_000 });

  const myMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!myMembership || !["OWNER", "ADMIN"].includes(myMembership.role)) {
    throw new Error("Forbidden");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      giftMode: true,
      modules: {
        where: { key: EventModuleKey.GIFTS },
        select: { enabled: true },
        take: 1,
      },
    },
  });
  if (!event) throw new Error("Event not found");

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { id: true, email: true, name: true },
  });

  await prisma.eventMember.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: {},
    create: { userId: user.id, eventId, role: "MEMBER" },
  });

  const giftsEnabled = event.modules[0]?.enabled === true;
  if (giftsEnabled && event.giftMode === EventGiftMode.PERSONAL_LISTS) {
    await prisma.$transaction(async (tx) => {
      await ensureGiftListForJoinedMember(tx, {
        eventId: event.id,
        userId: user.id,
      });
    });
  }

  const qp = new URLSearchParams({
    source: "invite",
    eventTitle: event.title,
    inviter: me.name ?? me.email,
  });

  const res = await signIn("nodemailer", {
    email,
    redirect: false,
    redirectTo: `/event/${event.slug}?${qp.toString()}`,
  });
  if (res?.error) throw new Error(res.error);

  revalidatePath(`/event/${event.slug}`);
  return { ok: true };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Retirer un membre (sécurisé)

export async function removeMemberAction(formData: FormData): Promise<void> {
  await removeMember(formData);
}

export async function removeMember(
  input: FormData | { slug?: string; eventId: string; userIdToRemove: string },
) {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Unauthorized" } as const;

  const parsed =
    input instanceof FormData
      ? {
          eventId: input.get("eventId")?.toString() ?? "",
          userIdToRemove: input.get("userIdToRemove")?.toString() ?? "",
          slug: input.get("slug")?.toString() || undefined,
        }
      : input;

  const { eventId, userIdToRemove, slug } = parsed;
  if (!eventId || !userIdToRemove) return { ok: false, error: "Champs requis" } as const;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return { ok: false, error: "Utilisateur introuvable" } as const;

  const meMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!meMembership) return { ok: false, error: "Forbidden" } as const;

  const targetMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: userIdToRemove, eventId } },
    select: { role: true },
  });
  if (!targetMembership) return { ok: true } as const;

  if (meMembership.role === "ADMIN") {
    if (targetMembership.role !== "MEMBER" || userIdToRemove === me.id) {
      return { ok: false, error: "Forbidden" } as const;
    }
  }
  if (meMembership.role === "OWNER" && userIdToRemove === me.id) {
    return { ok: false, error: "Forbidden" } as const;
  }

  await prisma.$transaction(async (tx) => {
    const aToB = await tx.secretSantaAssignment.findUnique({
      where: { eventId_giverId: { eventId, giverId: userIdToRemove } },
      select: { receiverId: true },
    });
    const cToA = await tx.secretSantaAssignment.findFirst({
      where: { eventId, receiverId: userIdToRemove },
      select: { giverId: true },
    });

    if (aToB && cToA) {
      await tx.secretSantaAssignment.update({
        where: { eventId_giverId: { eventId, giverId: cToA.giverId } },
        data: { receiverId: aToB.receiverId },
      });
      await tx.secretSantaAssignment.delete({
        where: { eventId_giverId: { eventId, giverId: userIdToRemove } },
      });
    } else {
      await tx.secretSantaAssignment.deleteMany({
        where: { eventId, OR: [{ giverId: userIdToRemove }, { receiverId: userIdToRemove }] },
      });
    }

    const remaining = await tx.eventMember.count({
      where: { eventId, NOT: { userId: userIdToRemove } },
    });
    if (remaining < 2) {
      await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    }

    await tx.reservation.updateMany({
      where: { byUserId: userIdToRemove, status: { not: "RELEASED" }, item: { list: { eventId } } },
      data: { status: "RELEASED" },
    });
    await deleteGiftListsForMember(tx, { eventId, userId: userIdToRemove });
    await tx.eventMember.delete({ where: { userId_eventId: { userId: userIdToRemove, eventId } } });
  });

  revalidatePath(slug ? `/event/${slug}` : "/event");
  revalidatePath(slug ? `/event/${slug}/participants` : "/event");
  return { ok: true } as const;
}
// Retirer un proche (copie exacte de ton code)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function removeRelative(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisÃ©");

  const eventId = fd.get("eventId")?.toString();
  const relativeId = fd.get("relativeId")?.toString();
  const slug = fd.get("slug")?.toString();

  if (!eventId || !relativeId) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  // RÃ©cupÃ¨re mon rÃ´le sur lâ€™Ã©vÃ©nement
  const meMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!meMembership) throw new Error("Interdit");

  // RÃ©cupÃ¨re le proche + Ã©ventuel profil global
  const relative = await prisma.eventRelative.findUnique({
    where: { id: relativeId },
    include: { managedProfile: true },
  });
  if (!relative || relative.eventId !== eventId) {
    // dÃ©jÃ  supprimÃ© ou pas sur cet Ã©vÃ©nement
    return;
  }

  const isOwnerOrAdmin = meMembership.role === ROLE.OWNER || meMembership.role === ROLE.ADMIN;

  const isCreator = relative.createdById === me.id;
  const isProfileOwner = relative.managedProfile && relative.managedProfile.ownerId === me.id;

  const canRemove = isOwnerOrAdmin || isCreator || isProfileOwner;
  if (!canRemove) throw new Error("Interdit");

  await prisma.$transaction(async (tx) => {
    // LibÃ¨re les rÃ©servations liÃ©es Ã  la liste du proche (si tu veux gÃ©rer le statut)
    await tx.reservation.updateMany({
      where: {
        status: { not: "RELEASED" },
        item: {
          list: { eventId, eventRelativeId: relativeId },
        },
      },
      data: { status: "RELEASED" },
    });

    // Supprime la/les listes du proche
    await deleteGiftListsForRelative(tx, { eventId, relativeId });

    // Supprime le proche de lâ€™Ã©vÃ©nement
    await tx.eventRelative.delete({
      where: { id: relativeId },
    });
  });

  // On rafraÃ®chit la page de lâ€™Ã©vÃ©nement (et donc la liste + la page participants)
  revalidatePath(slug ? `/event/${slug}` : "/event");
}
