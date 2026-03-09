// app/(app)/event/[slug]/actions/modules.ts

"use server";

import { auth } from "@/auth";
import { syncGiftListsForEvent } from "@/domain/gift-lists";
import { MODULE_POSITIONS } from "@/features/events/module-positions";
import { prisma } from "@/lib/prisma";
import { EventGiftMode, EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { updateGiftSettings } from "./gifts";
import { ensureLocationPoll } from "./polls";

// ─────────────────────────────────────────────────────────────
// Helper : Vérifier admin/owner access
// ─────────────────────────────────────────────────────────────
async function assertAdminAccess(eventId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    select: { role: true },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    throw new Error("Accès refusé");
  }

  return session.user.id;
}

// ─────────────────────────────────────────────────────────────
// BRING : Activer/Désactiver
// ─────────────────────────────────────────────────────────────
export async function activateBring(params: {
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    const potluckModule = await prisma.eventModule.upsert({
      where: { eventId_key: { eventId: params.eventId, key: "POTLUCK" } },
      update: { enabled: true, position: MODULE_POSITIONS.POTLUCK },
      create: {
        eventId: params.eventId,
        key: "POTLUCK",
        enabled: true,
        position: MODULE_POSITIONS.POTLUCK,
      },
    });

    await prisma.eventPotluckSettings.upsert({
      where: { eventModuleId: potluckModule.id },
      update: {},
      create: { eventModuleId: potluckModule.id },
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("activateBring error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function deactivateBring(params: {
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    // Supprimer tous les items associés
    await prisma.eventBringItem.deleteMany({
      where: { eventId: params.eventId },
    });

    await prisma.eventModule.upsert({
      where: { eventId_key: { eventId: params.eventId, key: "POTLUCK" } },
      update: { enabled: false, position: MODULE_POSITIONS.POTLUCK },
      create: {
        eventId: params.eventId,
        key: "POTLUCK",
        enabled: false,
        position: MODULE_POSITIONS.POTLUCK,
      },
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("deactivateBring error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// GIFTS : Activer/Désactiver
// ─────────────────────────────────────────────────────────────
export async function activateGifts(
  eventId: string,
  slug: string,
  giftMode: EventGiftMode,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(eventId);

    const result = await updateGiftSettings({
      eventId,
      slug,
      giftMode,
      isNoSpoil: true,
      isAnonReservations: true,
      isSecondHandOk: false,
      isHandmadeOk: false,
      budgetCapCents: null,
    });

    return result.success ? { ok: true } : { ok: false, error: result.error ?? "Erreur inconnue" };
  } catch (error) {
    console.error("activateGifts error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function deactivateGifts(params: {
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    // Supprimer toutes les listes + items + réservations
    await prisma.giftList.deleteMany({
      where: { eventId: params.eventId },
    });

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: params.eventId },
        data: { giftMode: EventGiftMode.HOST_LIST },
      });

      const giftsModule = await tx.eventModule.upsert({
        where: { eventId_key: { eventId: params.eventId, key: "GIFTS" } },
        update: { enabled: false, position: MODULE_POSITIONS.GIFTS },
        create: {
          eventId: params.eventId,
          key: "GIFTS",
          enabled: false,
          position: MODULE_POSITIONS.GIFTS,
        },
      });

      await tx.eventGiftsSettings.upsert({
        where: { eventModuleId: giftsModule.id },
        update: {
          isNoSpoil: true,
          isAnonReservations: true,
          isSecondHandOk: false,
          isHandmadeOk: false,
          budgetCapCents: null,
        },
        create: {
          eventModuleId: giftsModule.id,
          isNoSpoil: true,
          isAnonReservations: true,
          isSecondHandOk: false,
          isHandmadeOk: false,
          budgetCapCents: null,
        },
      });
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("deactivateGifts error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// LOCATION POLL : Créer un sondage de lieu
// ─────────────────────────────────────────────────────────────
export async function activateLocationPoll(params: {
  eventId: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);
    const result = await ensureLocationPoll(params.slug);
    if (!result.ok) {
      return { ok: false, error: "Erreur inconnue" };
    }

    return { ok: true };
  } catch (error) {
    console.error("activateLocationPoll error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic : Enable an event module
// ─────────────────────────────────────────────────────────────────────────────
export async function enableEventModule(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    const defaults = {
      isNoSpoil: true,
      isAnonReservations: true,
      isSecondHandOk: false,
      isHandmadeOk: false,
      budgetCapCents: null as number | null,
    };

    await prisma.$transaction(async (tx) => {
      const existing = await tx.eventModule.findUnique({
        where: { eventId_key: { eventId: params.eventId, key: params.key } },
        select: { id: true, position: true },
      });

      const aggregate = await tx.eventModule.aggregate({
        where: { eventId: params.eventId },
        _max: { position: true },
      });
      const nextPosition = (aggregate._max.position ?? -1) + 1;
      const position = existing?.position ?? nextPosition;

      const eventModule = await tx.eventModule.upsert({
        where: { eventId_key: { eventId: params.eventId, key: params.key } },
        update: { enabled: true, position },
        create: {
          eventId: params.eventId,
          key: params.key,
          enabled: true,
          position,
        },
        select: { id: true, key: true },
      });

      switch (params.key) {
        case EventModuleKey.GIFTS: {
          const current = await tx.event.findUnique({
            where: { id: params.eventId },
            select: { giftMode: true },
          });

          const giftMode = current?.giftMode ?? EventGiftMode.HOST_LIST;

          await tx.event.update({
            where: { id: params.eventId },
            data: { giftMode },
          });

          await tx.eventGiftsSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {
              isNoSpoil: defaults.isNoSpoil,
              isAnonReservations: defaults.isAnonReservations,
              isSecondHandOk: defaults.isSecondHandOk,
              isHandmadeOk: defaults.isHandmadeOk,
              budgetCapCents: defaults.budgetCapCents,
            },
            create: {
              eventModuleId: eventModule.id,
              ...defaults,
            },
          });
          break;
        }

        case EventModuleKey.SECRET_SANTA: {
          await tx.eventSecretSantaSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.POTLUCK: {
          await tx.eventPotluckSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.TIMELINE: {
          await tx.eventTimelineSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.EXPENSES: {
          await tx.eventExpensesSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.POLLS: {
          await tx.eventPollsSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.CHAT: {
          await tx.eventChatSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        }

        case EventModuleKey.OVERVIEW: {
          await tx.eventOverviewSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id, rsvpRequired: true },
          });
          break;
        }

        default:
          break;
      }
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("enableEventModule error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic : Disable an event module
// ─────────────────────────────────────────────────────────────────────────────
export async function disableEventModule(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    if (params.key === EventModuleKey.OVERVIEW) {
      return { ok: false, error: "Le module Aperçu ne peut pas être désactivé." };
    }

    await prisma.$transaction(async (tx) => {
      // disable requested module
      await tx.eventModule.updateMany({
        where: { eventId: params.eventId, key: params.key },
        data: { enabled: false },
      });

      // No implicit coupling between GIFTS and SECRET_SANTA anymore.
    });

    revalidatePath(`/event/${params.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("disableEventModule error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GIFTS : Mettre à jour la configuration (mode + confidentialité)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateGiftsModuleConfig(params: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isAnonReservations: boolean;
  isNoSpoil: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminAccess(params.eventId);

    const safeMode =
      params.giftMode === EventGiftMode.PERSONAL_LISTS ||
      params.giftMode === EventGiftMode.HOST_LIST
        ? params.giftMode
        : EventGiftMode.HOST_LIST;

    await prisma.$transaction(async (tx) => {
      const giftsModule = await tx.eventModule.upsert({
        where: { eventId_key: { eventId: params.eventId, key: EventModuleKey.GIFTS } },
        update: { enabled: true, position: MODULE_POSITIONS.GIFTS },
        create: {
          eventId: params.eventId,
          key: EventModuleKey.GIFTS,
          enabled: true,
          position: MODULE_POSITIONS.GIFTS,
        },
        select: { id: true },
      });

      const existingSettings = await tx.eventGiftsSettings.findUnique({
        where: { eventModuleId: giftsModule.id },
        select: {
          isSecondHandOk: true,
          isHandmadeOk: true,
          budgetCapCents: true,
        },
      });

      await tx.event.update({
        where: { id: params.eventId },
        data: { giftMode: safeMode },
      });

      await tx.eventGiftsSettings.upsert({
        where: { eventModuleId: giftsModule.id },
        update: {
          isNoSpoil: params.isNoSpoil,
          isAnonReservations: params.isAnonReservations,
          isSecondHandOk: existingSettings?.isSecondHandOk ?? false,
          isHandmadeOk: existingSettings?.isHandmadeOk ?? false,
          budgetCapCents: existingSettings?.budgetCapCents ?? null,
        },
        create: {
          eventModuleId: giftsModule.id,
          isNoSpoil: params.isNoSpoil,
          isAnonReservations: params.isAnonReservations,
          isSecondHandOk: existingSettings?.isSecondHandOk ?? false,
          isHandmadeOk: existingSettings?.isHandmadeOk ?? false,
          budgetCapCents: existingSettings?.budgetCapCents ?? null,
        },
      });

      await syncGiftListsForEvent(tx, params.eventId);
    });

    revalidatePath(`/event/${params.slug}`, "page");
    revalidatePath(`/event/${params.slug}/gifts`, "page");
    return { ok: true };
  } catch (error) {
    console.error("updateGiftsModuleConfig error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
