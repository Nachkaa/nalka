"use server";

import { EventGiftMode, EventModuleKey } from "@prisma/client";

import {
  activateGiftsModule,
  activatePotluckModule,
  deactivateGiftsModule,
  deactivatePotluckModule,
  disableEventModuleFromManager,
  enableEventModuleFromManager,
  updateGiftsModuleManagerConfig,
} from "@/features/events/server/module-manager";

export async function activateBring(params: { eventId: string; slug: string }) {
  return activatePotluckModule(params);
}

export async function deactivateBring(params: { eventId: string; slug: string }) {
  return deactivatePotluckModule(params);
}

export async function activateGifts(
  eventId: string,
  slug: string,
  giftMode: EventGiftMode,
) {
  return activateGiftsModule({ eventId, slug, giftMode });
}

export async function deactivateGifts(params: { eventId: string; slug: string }) {
  return deactivateGiftsModule(params);
}

export async function enableEventModule(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}) {
  return enableEventModuleFromManager(params);
}

export async function disableEventModule(params: {
  eventId: string;
  slug: string;
  key: EventModuleKey;
}) {
  return disableEventModuleFromManager(params);
}

export async function updateGiftsModuleConfig(params: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isAnonReservations: boolean;
  isNoSpoil: boolean;
}) {
  return updateGiftsModuleManagerConfig(params);
}
