import { EventModuleKey, type EventGiftMode } from "@prisma/client";

import { MODULE_POSITIONS } from "@/features/events/module-positions";
import { syncGiftListsIfEnabled } from "@/features/gifts/server/lifecycle";
import { prisma } from "@/lib/prisma";

import { requireGiftsOrganizerAccess } from "../access";
import { revalidateGiftSettingsPaths } from "./shared";

type UpdateGiftsSettingsArgs = {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
  budgetCapCents: number | null;
};

export async function updateGiftsSettings(args: UpdateGiftsSettingsArgs) {
  await requireGiftsOrganizerAccess(args.eventId);

  const normalized = {
    isNoSpoil: args.isNoSpoil,
    isAnonReservations: args.isAnonReservations,
    isSecondHandOk: args.isSecondHandOk,
    isHandmadeOk: args.isHandmadeOk,
    budgetCapCents: args.budgetCapCents,
  };

  await prisma.$transaction(async (tx) => {
    const event = await tx.event.update({
      where: { id: args.eventId },
      data: { giftMode: args.giftMode },
      select: { id: true, giftMode: true },
    });

    const giftsModule = await tx.eventModule.upsert({
      where: {
        eventId_key: {
          eventId: args.eventId,
          key: EventModuleKey.GIFTS,
        },
      },
      update: {
        enabled: true,
        position: MODULE_POSITIONS.GIFTS,
      },
      create: {
        eventId: args.eventId,
        key: EventModuleKey.GIFTS,
        enabled: true,
        position: MODULE_POSITIONS.GIFTS,
      },
    });

    await tx.eventGiftsSettings.upsert({
      where: { eventModuleId: giftsModule.id },
      update: normalized,
      create: {
        eventModuleId: giftsModule.id,
        ...normalized,
      },
    });

    if (giftsModule.enabled && event.giftMode === "PERSONAL_LISTS") {
      await syncGiftListsIfEnabled(tx, event.id);
    }
  });

  revalidateGiftSettingsPaths(args.slug);
}
