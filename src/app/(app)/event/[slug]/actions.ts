"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";
import { sendGiftRemovedEmail } from "@/features/notifications/sendGiftRemovedEmail";
import type { BringCategory } from "@prisma/client";
import { assertUserInEvent, assertCanManageBringItem } from "@/features/events/permissions";
import { EventMemberRole as ROLE } from "@prisma/client";
import { syncGiftListsForEvent } from "@/domain/gift-lists";


const schema = z.object({
  eventId: z.string().min(1),
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

export async function deleteGift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const itemId = formData.get("itemId")?.toString();
  const eventId = formData.get("eventId")?.toString();
  if (!itemId || !eventId) throw new Error("Paramètres manquants");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  // On récupère l’item + contexte + réservations
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        include: {
          owner: true,
          event: true,
          eventRelative: true,   // <- ajout utile pour fallback
        },
      },
      reservations: {
        include: {
          byUser: true,
        },
      },
    },
  });

  if (!item || item.list.ownerId !== me.id) throw new Error("Interdit");

  const activeReservations = item.reservations.filter(
    (r) => r.status !== "RELEASED"
  );

  // Résolution du nom "owner"
  const ownerName =
    item.list.owner?.name ??
    item.list.owner?.email ??
    item.list.eventRelative?.firstName ??
    "Un proche";

  await Promise.all(
    activeReservations
      .filter((r) => r.byUser?.email)
      .map((r) =>
        sendGiftRemovedEmail({
          to: r.byUser!.email!,
          recipientName: r.byUser!.name ?? r.byUser!.email!,
          giftTitle: item.title,
          eventTitle: item.list.event.title,
          ownerName,
        })
      )
  );

  await prisma.reservation.deleteMany({ where: { itemId } });
  await prisma.giftItem.delete({ where: { id: itemId } });

  revalidatePath(`/app/event/${eventId}`);
}


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

  // RATE LIMITS — abuse control
  const ip = await getClientIp();
  await limit({ key: `invite:ip:${ip}`, max: 60, windowMs: 60 * 60_000 }); // 60 / hour / IP
  await limit({ key: `invite:user:${me.id}`, max: 200, windowMs: 24 * 60 * 60_000 }); // 200 / day / inviter
  await limit({ key: `invite:event:${eventId}`, max: 500, windowMs: 24 * 60 * 60_000 }); // 500 / day / event
  await limit({ key: `invite:target:${email}`, max: 3, windowMs: 24 * 60 * 60_000 }); // 3 / day / target email

  // must be OWNER or ADMIN
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
      hasGifts: true,
      giftMode: true,
    },
  });
  if (!event) throw new Error("Event not found");

  // ensure user exists
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { id: true, email: true, name: true },
  });

  // ensure membership
  await prisma.eventMember.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: {},
    create: { userId: user.id, eventId, role: "MEMBER" },
  });

  // ensure personal list for events à listes perso (PERSONAL_LISTS / SECRET_SANTA)
  if (event.hasGifts && event.giftMode !== "HOST_LIST") {
    const existingList = await prisma.giftList.findFirst({
      where: {
        eventId: event.id,
        ownerId: user.id,
        eventRelativeId: null,
      },
      select: { id: true },
    });

    if (!existingList) {
      await prisma.giftList.create({
        data: {
          eventId: event.id,
          ownerId: user.id,
          title: "Ma liste",
        },
      });
    }
  }

  // invite email
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


export async function removeMember(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const eventId = fd.get("eventId")?.toString();
  const userId = fd.get("userId")?.toString();
  const slug = fd.get("slug")?.toString();
  if (!eventId || !userId) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const meMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!meMembership) throw new Error("Interdit");

  const targetMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });
  if (!targetMembership) return; // already removed

  if (meMembership.role === "ADMIN" && targetMembership.role !== "MEMBER") throw new Error("Interdit");
  if (meMembership.role === "OWNER" && userId === me.id) throw new Error("Interdit");

  await prisma.$transaction(async (tx) => {
    // Secret-Santa: rewire C→B, delete A→B, or purge links if partial
    const aToB = await tx.secretSantaAssignment.findUnique({
      where: { eventId_giverId: { eventId, giverId: userId } },
      select: { receiverId: true },
    });
    const cToA = await tx.secretSantaAssignment.findFirst({
      where: { eventId, receiverId: userId },
      select: { giverId: true },
    });

    if (aToB && cToA) {
      await tx.secretSantaAssignment.update({
        where: { eventId_giverId: { eventId, giverId: cToA.giverId } },
        data: { receiverId: aToB.receiverId },
      });
      await tx.secretSantaAssignment.delete({
        where: { eventId_giverId: { eventId, giverId: userId } },
      });
    } else {
      await tx.secretSantaAssignment.deleteMany({
        where: { eventId, OR: [{ giverId: userId }, { receiverId: userId }] },
      });
    }

    // If <2 members remain, wipe all assignments
    const remaining = await tx.eventMember.count({
      where: { eventId, NOT: { userId } },
    });
    if (remaining < 2) {
      await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    }

    // Release reservations and delete list + membership
    await tx.reservation.updateMany({
      where: { byUserId: userId, status: { not: "RELEASED" }, item: { list: { eventId } } },
      data: { status: "RELEASED" },
    });
    await tx.giftList.deleteMany({ where: { ownerId: userId, eventId } });
    await tx.eventMember.delete({ where: { userId_eventId: { userId, eventId } } });
  });

  revalidatePath(slug ? `/event/${slug}` : "/event");
}

export async function removeRelative(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const eventId = fd.get("eventId")?.toString();
  const relativeId = fd.get("relativeId")?.toString();
  const slug = fd.get("slug")?.toString();

  if (!eventId || !relativeId) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  // Récupère mon rôle sur l’événement
  const meMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!meMembership) throw new Error("Interdit");

  // Récupère le proche + éventuel profil global
  const relative = await prisma.eventRelative.findUnique({
    where: { id: relativeId },
    include: { managedProfile: true },
  });
  if (!relative || relative.eventId !== eventId) {
    // déjà supprimé ou pas sur cet événement
    return;
  }

  const isOwnerOrAdmin =
    meMembership.role === ROLE.OWNER || meMembership.role === ROLE.ADMIN;

  const isCreator = relative.createdById === me.id;
  const isProfileOwner =
    relative.managedProfile && relative.managedProfile.ownerId === me.id;

  const canRemove = isOwnerOrAdmin || isCreator || isProfileOwner;
  if (!canRemove) throw new Error("Interdit");

  await prisma.$transaction(async (tx) => {
    // Libère les réservations liées à la liste du proche (si tu veux gérer le statut)
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
    await tx.giftList.deleteMany({
      where: { eventId, eventRelativeId: relativeId },
    });

    // Supprime le proche de l’événement
    await tx.eventRelative.delete({
      where: { id: relativeId },
    });
  });

  // On rafraîchit la page de l’événement (et donc la liste + la page participants)
  revalidatePath(slug ? `/event/${slug}` : "/event");
}

export async function deleteEvent(fd: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const eventId = fd.get("eventId")?.toString();
  if (!eventId) throw new Error("Missing eventId");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("User not found");

  // Only OWNER can delete (safer than ADMIN)
  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") throw new Error("Forbidden");

  await prisma.event.delete({ where: { id: eventId } }); // cascades per schema

  revalidatePath("/event");
  redirect("/event");
}

export async function createBringItem(data: {
  eventId: string;
  label: string;
  category: BringCategory; // <- obligatoire maintenant
  note?: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const label = data.label.trim();
  if (!label) {
    throw new Error("Label is required");
  }

  // Vérifie que l'user appartient bien à l’événement
  await assertUserInEvent(data.eventId, userId);

  return prisma.eventBringItem.create({
    data: {
      eventId: data.eventId,
      label,
      category: data.category,          // enum BringCategory garanti
      note: data.note?.trim() || null,
      createdById: userId,
    },
  });
}

// ----------------------------
// TOGGLE PARTICIPATION
// ----------------------------
export async function toggleBringParticipation(params: { itemId: string }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const item = await prisma.eventBringItem.findUnique({
    where: { id: params.itemId },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  await assertUserInEvent(item.eventId, userId);

  const existing = await prisma.eventBringParticipation.findFirst({
    where: {
      itemId: item.id,
      userId,
    },
  });

  if (existing) {
    await prisma.eventBringParticipation.delete({
      where: { id: existing.id },
    });
    return { joined: false };
  }

  await prisma.eventBringParticipation.create({
    data: {
      itemId: item.id,
      userId,
    },
  });

  return { joined: true };
}

export async function deleteBringItem(params: { itemId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const item = await prisma.eventBringItem.findUnique({
    where: { id: params.itemId },
    include: {
      event: {
        include: {
          memberships: true,
        },
      },
    },
  });

  if (!item) return;

  await assertCanManageBringItem(params.itemId);

  await prisma.eventBringItem.delete({
    where: { id: params.itemId },
  });
}

export async function updateBringItem(data: {
  itemId: string;
  label: string;
  category: BringCategory;
  note?: string;
  bringerIds?: string[];
}) {
  await assertCanManageBringItem(data.itemId);

  const label = data.label.trim();
  if (!label) throw new Error("Label is required");

  const note = data.note?.trim() || null;
  const bringerIds = data.bringerIds ?? [];

  await prisma.$transaction([
    prisma.eventBringItem.update({
      where: { id: data.itemId },
      data: {
        label,
        category: data.category,
        note,
      },
    }),
    prisma.eventBringParticipation.deleteMany({
      where: { itemId: data.itemId },
    }),
    ...(bringerIds.length
      ? [
        prisma.eventBringParticipation.createMany({
          data: bringerIds.map((userId) => ({ itemId: data.itemId, userId })),
        }),
      ]
      : []),
  ]);
}

export async function setBringSectionEnabled(params: {
  eventId: string;
  enabled: boolean;
  slug: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { eventId, enabled, slug } = params;

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    throw new Error("Forbidden");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { hasBringSection: enabled },
  });

  // important : on revalide par slug, pas par id
  revalidatePath(`/event/${slug}`, "page");
}