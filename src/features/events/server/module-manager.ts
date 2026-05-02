"use server";

import { EventGiftMode, EventModuleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ensureBudgetForEvent } from "@/features/budget/server/ensure-budget-exists";
import { requireEventOrganizer } from "@/features/events/access";
import { MODULE_POSITIONS } from "@/features/events/module-positions";
import {
  clearGiftListsForEvent,
  syncGiftListsIfEnabled,
} from "@/features/gifts/server/lifecycle";
import { updateGiftsSettings } from "@/features/gifts/server/mutations";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: boolean; error?: string };

async function requireOrganizerUserId(eventId: string) {
  const access = await requireEventOrganizer({ eventId });
  return access.userId;
}

function toActionError(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Erreur inconnue",
  };
}

function revalidateEventShellPaths(slug: string) {
  revalidatePath(`/event/${slug}`, "page");
}

function revalidateBudgetPaths(slug: string) {
  revalidatePath(`/event/${slug}/budget`, "page");
  revalidatePath(`/event/${slug}/budget/lines`, "page");
  revalidatePath(`/event/${slug}/budget/quotes`, "page");
}

export async function activatePotluckModule(params: {
  eventId: string;
  slug: string;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

    const potluckModule = await prisma.eventModule.upsert({
      where: { eventId_key: { eventId: params.eventId, key: EventModuleKey.POTLUCK } },
      update: { enabled: true, position: MODULE_POSITIONS.POTLUCK },
      create: {
        eventId: params.eventId,
        key: EventModuleKey.POTLUCK,
        enabled: true,
        position: MODULE_POSITIONS.POTLUCK,
      },
    });

    await prisma.eventPotluckSettings.upsert({
      where: { eventModuleId: potluckModule.id },
      update: {},
      create: { eventModuleId: potluckModule.id },
    });

    revalidateEventShellPaths(params.slug);
    revalidateBudgetPaths(params.slug);
    return { ok: true };
  } catch (error) {
    console.error("activatePotluckModule error:", error);
    return toActionError(error);
  }
}

export async function deactivatePotluckModule(params: {
  eventId: string;
  slug: string;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

    await prisma.eventBringItem.deleteMany({
      where: { eventId: params.eventId },
    });

    await prisma.eventModule.upsert({
      where: { eventId_key: { eventId: params.eventId, key: EventModuleKey.POTLUCK } },
      update: { enabled: false, position: MODULE_POSITIONS.POTLUCK },
      create: {
        eventId: params.eventId,
        key: EventModuleKey.POTLUCK,
        enabled: false,
        position: MODULE_POSITIONS.POTLUCK,
      },
    });

    revalidateEventShellPaths(params.slug);
    revalidateBudgetPaths(params.slug);
    return { ok: true };
  } catch (error) {
    console.error("deactivatePotluckModule error:", error);
    return toActionError(error);
  }
}

export async function activateGiftsModule(params: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

    await updateGiftsSettings({
      eventId: params.eventId,
      slug: params.slug,
      giftMode: params.giftMode,
      isNoSpoil: true,
      isAnonReservations: true,
      isSecondHandOk: false,
      isHandmadeOk: false,
      budgetCapCents: null,
    });

    return { ok: true };
  } catch (error) {
    console.error("activateGiftsModule error:", error);
    return toActionError(error);
  }
}

export async function deactivateGiftsModule(params: {
  eventId: string;
  slug: string;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

    await prisma.$transaction(async (tx) => {
      await clearGiftListsForEvent(tx, { eventId: params.eventId });

      await tx.event.update({
        where: { id: params.eventId },
        data: { giftMode: EventGiftMode.HOST_LIST },
      });

      const giftsModule = await tx.eventModule.upsert({
        where: { eventId_key: { eventId: params.eventId, key: EventModuleKey.GIFTS } },
        update: { enabled: false, position: MODULE_POSITIONS.GIFTS },
        create: {
          eventId: params.eventId,
          key: EventModuleKey.GIFTS,
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

    revalidateEventShellPaths(params.slug);
    return { ok: true };
  } catch (error) {
    console.error("deactivateGiftsModule error:", error);
    return toActionError(error);
  }
}

export async function enableEventModuleFromManager(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

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
        case EventModuleKey.GIFTS:
          break;
        case EventModuleKey.SECRET_SANTA:
          await tx.eventSecretSantaSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        case EventModuleKey.POTLUCK:
          await tx.eventPotluckSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        case EventModuleKey.TIMELINE:
          await tx.eventTimelineSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        case EventModuleKey.BUDGET: {
          await tx.eventExpensesSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          const currentEvent = await tx.event.findUnique({
            where: { id: params.eventId },
            select: { budgetCents: true },
          });
          await ensureBudgetForEvent(tx, params.eventId, {
            totalBudgetCents: currentEvent?.budgetCents ?? null,
          });
          break;
        }
        case EventModuleKey.POLLS:
          await tx.eventPollsSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        case EventModuleKey.CHAT:
          await tx.eventChatSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id },
          });
          break;
        case EventModuleKey.OVERVIEW:
          await tx.eventOverviewSettings.upsert({
            where: { eventModuleId: eventModule.id },
            update: {},
            create: { eventModuleId: eventModule.id, rsvpRequired: true },
          });
          break;
        default:
          break;
      }
    });

    revalidateEventShellPaths(params.slug);
    return { ok: true };
  } catch (error) {
    console.error("enableEventModuleFromManager error:", error);
    return toActionError(error);
  }
}

export async function disableEventModuleFromManager(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

    if (params.key === EventModuleKey.OVERVIEW) {
      return { ok: false, error: "Le module Apercu ne peut pas etre desactive." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventModule.updateMany({
        where: { eventId: params.eventId, key: params.key },
        data: { enabled: false },
      });
    });

    revalidateEventShellPaths(params.slug);
    return { ok: true };
  } catch (error) {
    console.error("disableEventModuleFromManager error:", error);
    return toActionError(error);
  }
}

export async function updateGiftsModuleManagerConfig(params: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isAnonReservations: boolean;
  isNoSpoil: boolean;
}): Promise<ActionResult> {
  try {
    await requireOrganizerUserId(params.eventId);

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

      await syncGiftListsIfEnabled(tx, params.eventId);
    });

    revalidateEventShellPaths(params.slug);
    revalidatePath(`/event/${params.slug}/gifts`, "page");
    return { ok: true };
  } catch (error) {
    console.error("updateGiftsModuleManagerConfig error:", error);
    return toActionError(error);
  }
}
