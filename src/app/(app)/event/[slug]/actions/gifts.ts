"use server";

import type { EventGiftMode } from "@prisma/client";

import {
  deleteGiftAction,
  updateGiftSettingsAction,
} from "@/features/gifts/actions";

export async function updateGiftSettings(args: {
  eventId: string;
  slug: string;
  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
  budgetCapCents: number | null;
}) {
  return updateGiftSettingsAction(args);
}

export async function deleteGift(formData: FormData) {
  return deleteGiftAction(formData);
}
