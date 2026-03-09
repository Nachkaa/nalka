// app/(app)/event/[slug]/gifts/actions.ts

"use server";

import { auth } from "@/auth";
import { syncGiftListsForEvent } from "@/domain/gift-lists";
import { requireCan } from "@/features/events/acl";
import { sendGiftRemovedEmail } from "@/features/notifications/sendGiftRemovedEmail";
import { processGiftImage } from "@/lib/gift-image";
import { prisma } from "@/lib/prisma";
import { limit } from "@/lib/rate-limit";
import { validateGiftUrlOrThrow } from "@/lib/url";
import { EventGiftMode, EventModuleKey, ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================
// HELPER: Get current user or throw
// ============================================
async function getCurrentUserOrThrow() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

// ============================================
// HELPER: Get target list for current user
// ============================================
async function getTargetListForUser(eventId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        giftMode: true,
        modules: {
          where: { key: EventModuleKey.GIFTS },
          select: { enabled: true },
          take: 1,
        },
      },
    });

    if (!event) throw new Error("Event not found");
    if (event.modules[0]?.enabled !== true) {
      throw new Error("Les cadeaux sont désactivés pour cet événement.");
    }

    await syncGiftListsForEvent(tx, event.id);

    let targetList: { id: string } | null = null;

    if (event.giftMode === EventGiftMode.HOST_LIST) {
      targetList = await tx.giftList.findFirst({
        where: { eventId: event.id, ownerId: event.ownerId },
        select: { id: true },
      });
    } else {
      targetList = await tx.giftList.findFirst({
        where: { eventId: event.id, ownerId: userId },
        select: { id: true },
      });
    }

    if (!targetList) {
      throw new Error("Aucune liste de cadeaux disponible.");
    }

    return targetList;
  });
}

// ============================================
// CREATE GIFT
// ============================================
export async function addGift(eventId: string, slug: string, formData: FormData) {
  await createGiftItem(eventId, slug, formData);
  redirect(`/event/${slug}`);
}

// ============================================
// UPDATE GIFT
// ============================================
export async function updateGift(
  eventId: string,
  slug: string,
  itemId: string,
  formData: FormData,
) {
  await updateGiftItem(eventId, slug, itemId, formData);
  redirect(`/event/${slug}/gifts`);
}

// ============================================
// CREATE GIFT (modal / in-page)
// ============================================
export async function createGiftItem(eventId: string, slug: string, formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Le titre est requis");

  await requireCan(user.id, eventId, "gift:create");
  await limit({
    key: `act:gifts:create:user:${user.id}`,
    max: 30,
    windowMs: 60 * 60_000,
  });

  const list = await getTargetListForUser(eventId, user.id);

  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;
  const note = noteRaw || null;

  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await processGiftImage(imageFile);
  } else if (imageUrl) {
    imagePath = imageUrl;
  }

  const gift = await prisma.giftItem.create({
    data: {
      listId: list.id,
      title,
      note,
      url,
      imagePath,
    },
    select: { id: true },
  });

  revalidatePath(`/event/${slug}`);
  revalidatePath(`/event/${slug}/gifts`);

  return { id: gift.id };
}

// ============================================
// UPDATE GIFT (modal / in-page)
// ============================================
export async function updateGiftItem(
  eventId: string,
  slug: string,
  itemId: string,
  formData: FormData,
) {
  const user = await getCurrentUserOrThrow();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Le titre est requis");

  await requireCan(user.id, eventId, "gift:update");
  await limit({
    key: `act:gifts:update:user:${user.id}`,
    max: 50,
    windowMs: 60 * 60_000,
  });

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        select: { ownerId: true, eventId: true },
      },
      reservations: {
        where: { status: { not: ReservationStatus.RELEASED } },
        include: {
          byUser: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  if (!item || item.list.ownerId !== user.id || item.list.eventId !== eventId) {
    throw new Error("Non autorisé");
  }

  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;
  const note = noteRaw || null;

  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  let imagePath: string | null = item.imagePath;
  if (imageFile && imageFile.size > 0) {
    imagePath = await processGiftImage(imageFile);
  } else if (imageUrl && imageUrl !== item.imagePath) {
    imagePath = imageUrl;
  }

  await prisma.giftItem.update({
    where: { id: itemId },
    data: { title, note, url, imagePath },
  });

  if (item.reservations.length > 0) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });

    for (const res of item.reservations) {
      if (res.byUser?.email) {
        await sendGiftRemovedEmail({
          to: res.byUser.email,
          recipientName: res.byUser.name ?? "Participant",
          eventTitle: event?.title ?? "Événement",
          giftTitle: item.title,
          ownerName: item.list.ownerId === user.id ? (user.name ?? "Organisateur") : "Organisateur",
        });
      }
    }
  }

  revalidatePath(`/event/${slug}`);
  revalidatePath(`/event/${slug}/gifts`);

  return { id: itemId };
}

// ============================================
// DELETE GIFT
// ============================================
export async function deleteGift(formData: FormData) {
  const user = await getCurrentUserOrThrow();
  const itemId = formData.get("itemId") as string;
  const eventId = formData.get("eventId") as string;

  if (!itemId || !eventId) throw new Error("Paramètres manquants");

  await requireCan(user.id, eventId, "gift:delete");
  await limit({
    key: `act:gifts:delete:user:${user.id}`,
    max: 30,
    windowMs: 60 * 60_000,
  });

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        select: { ownerId: true, eventId: true, event: { select: { slug: true, title: true } } },
      },
      reservations: {
        where: { status: { not: ReservationStatus.RELEASED } },
        include: {
          byUser: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  if (!item || item.list.ownerId !== user.id || item.list.eventId !== eventId) {
    throw new Error("Non autorisé");
  }

  // Notify reservers
  if (item.reservations.length > 0) {
    for (const res of item.reservations) {
      if (res.byUser?.email) {
        await sendGiftRemovedEmail({
          to: res.byUser.email,
          recipientName: res.byUser.name ?? "Participant",
          eventTitle: item.list.event.title,
          giftTitle: item.title,
          ownerName: user.name ?? "Organisateur",
        });
      }
    }
  }

  await prisma.giftItem.delete({ where: { id: itemId } });

  revalidatePath(`/event/${item.list.event.slug}`);
  revalidatePath(`/event/${item.list.event.slug}/gifts`);
}

// ============================================
// RESERVE GIFT
// ============================================
export async function reserveGift(eventId: string, slug: string, itemId: string) {
  const user = await getCurrentUserOrThrow();

  await requireCan(user.id, eventId, "gift:reserve");
  await limit({
    key: `act:gifts:reserve:user:${user.id}`,
    max: 50,
    windowMs: 60 * 60_000,
  });

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        select: { eventId: true, ownerId: true },
      },
      reservations: {
        where: { status: { not: ReservationStatus.RELEASED } },
      },
    },
  });

  if (!item || item.list.eventId !== eventId) {
    throw new Error("Item introuvable");
  }

  // Can't reserve own gifts
  if (item.list.ownerId === user.id) {
    throw new Error("Tu ne peux pas réserver ton propre cadeau");
  }

  // Check if already reserved by someone else
  const activeRes = item.reservations.find((r) => r.byUserId !== user.id);
  if (activeRes) {
    throw new Error("Ce cadeau est déjà réservé");
  }

  // Check if already reserved by me
  const myRes = item.reservations.find((r) => r.byUserId === user.id);
  if (myRes) {
    return; // Already reserved, do nothing
  }

  await prisma.reservation.create({
    data: {
      itemId,
      byUserId: user.id,
      status: ReservationStatus.RESERVED,
    },
  });

  revalidatePath(`/event/${slug}/gifts`);
}

// ============================================
// UNRESERVE GIFT
// ============================================
export async function unreserveGift(eventId: string, slug: string, itemId: string) {
  const user = await getCurrentUserOrThrow();

  await requireCan(user.id, eventId, "gift:reserve");
  await limit({
    key: `act:gifts:unreserve:user:${user.id}`,
    max: 50,
    windowMs: 60 * 60_000,
  });

  const reservation = await prisma.reservation.findFirst({
    where: {
      itemId,
      byUserId: user.id,
      status: ReservationStatus.RESERVED,
    },
    include: {
      item: {
        include: {
          list: {
            select: { eventId: true },
          },
        },
      },
    },
  });

  if (!reservation || reservation.item.list.eventId !== eventId) {
    throw new Error("Réservation introuvable");
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: ReservationStatus.RELEASED },
  });

  revalidatePath(`/event/${slug}/gifts`);
}

// ============================================
// SUGGEST GIFT
// ============================================
// CHANGES ONLY
// add near other exports

export async function suggestGiftItem(
  eventId: string,
  slug: string,
  targetListId: string,
  formData: FormData,
) {
  const user = await getCurrentUserOrThrow();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Le titre est requis");

  // permission + rate limit (new ability is cleaner, but keep same style)
  await requireCan(user.id, eventId, "gift:create");
  await limit({
    key: `act:gifts:suggest:user:${user.id}`,
    max: 50,
    windowMs: 60 * 60_000,
  });

  // target list must exist in this event and must NOT be the user's own list
  const list = await prisma.giftList.findUnique({
    where: { id: targetListId },
    select: { id: true, ownerId: true, eventId: true },
  });

  if (!list || list.eventId !== eventId) {
    throw new Error("Liste introuvable");
  }
  if (list.ownerId === user.id) {
    throw new Error("Tu ne peux pas suggérer une idée sur ta propre liste");
  }

  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;
  const note = noteRaw || null;

  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  let imagePath: string | null = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await processGiftImage(imageFile);
  } else if (imageUrl) {
    imagePath = imageUrl;
  }

  const gift = await prisma.giftItem.create({
    data: {
      listId: list.id,
      title,
      note,
      url,
      imagePath,
      isSuggestion: true,
      // if you have a field for it, uncomment:
      // suggestedByUserId: user.id,
    },
    select: { id: true },
  });

  revalidatePath(`/event/${slug}`);
  revalidatePath(`/event/${slug}/gifts`);

  return { id: gift.id };
}
