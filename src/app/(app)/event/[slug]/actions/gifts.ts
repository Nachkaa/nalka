// app/(app)/event/[slug]/actions/gifts.ts

"use server";

import { auth } from "@/auth";
import { syncGiftListsForEvent } from "@/domain/gift-lists";
import { MODULE_POSITIONS } from "@/features/events/module-positions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EventGiftMode, EventModuleKey } from "@prisma/client";
import { sendGiftRemovedEmail } from "@/features/notifications/sendGiftRemovedEmail";

// ─────────────────────────────────────────────────────────────
// Helper : Vérifier admin/owner access
// ─────────────────────────────────────────────────────────────
async function assertAdminAccess(eventId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const membership = await prisma.eventMember.findUnique({
    where: {
      userId_eventId: { userId: session.user.id, eventId },
    },
    select: { role: true },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    throw new Error("Accès refusé");
  }

  return session.user.id;
}

// ─────────────────────────────────────────────────────────────
// Mettre à jour les paramètres cadeaux
// ─────────────────────────────────────────────────────────────
export async function updateGiftSettings({
  eventId,
  slug,
  giftMode,
  isNoSpoil,
  isAnonReservations,
  isSecondHandOk,
  isHandmadeOk,
  budgetCapCents,
}: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
  budgetCapCents: number | null;
}) {
  try {
    await assertAdminAccess(eventId);

    const normalized = {
      isNoSpoil,
      isAnonReservations,
      isSecondHandOk,
      isHandmadeOk,
      budgetCapCents,
    };

    await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: { giftMode },
        select: { id: true, giftMode: true },
      });

      const giftsModule = await tx.eventModule.upsert({
        where: { eventId_key: { eventId, key: EventModuleKey.GIFTS } },
        update: {
          enabled: true,
          position: MODULE_POSITIONS.GIFTS,
        },
        create: {
          eventId,
          key: EventModuleKey.GIFTS,
          enabled: true,
          position: MODULE_POSITIONS.GIFTS,
        },
      });

      await tx.eventGiftsSettings.upsert({
        where: { eventModuleId: giftsModule.id },
        update: {
          isNoSpoil: normalized.isNoSpoil,
          isAnonReservations: normalized.isAnonReservations,
          isSecondHandOk: normalized.isSecondHandOk,
          isHandmadeOk: normalized.isHandmadeOk,
          budgetCapCents: normalized.budgetCapCents,
        },
        create: {
          eventModuleId: giftsModule.id,
          isNoSpoil: normalized.isNoSpoil,
          isAnonReservations: normalized.isAnonReservations,
          isSecondHandOk: normalized.isSecondHandOk,
          isHandmadeOk: normalized.isHandmadeOk,
          budgetCapCents: normalized.budgetCapCents,
        },
      });

      if (giftsModule.enabled && event.giftMode === EventGiftMode.PERSONAL_LISTS) {
        await syncGiftListsForEvent(tx, event.id);
      }
    });

    revalidatePath(`/event/${slug}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating gift settings:", error);
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

// ─────────────────────────────────────────────────────────────
// Supprimer un cadeau
// ─────────────────────────────────────────────────────────────
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

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        include: {
          owner: true,
          event: true,
          eventRelative: true,
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

  const activeReservations = item.reservations.filter((r) => r.status !== "RELEASED");

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
        }),
      ),
  );

  await prisma.reservation.deleteMany({ where: { itemId } });
  await prisma.giftItem.delete({ where: { id: itemId } });

  revalidatePath(`/app/event/${eventId}`);
}
