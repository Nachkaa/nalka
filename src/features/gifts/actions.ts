"use server";

import type { EventGiftMode } from "@prisma/client";

import {
  createGiftItem as createGiftItemMutation,
  deleteGiftItem as deleteGiftItemMutation,
  suggestGiftItem as suggestGiftItemMutation,
  updateGiftItem as updateGiftItemMutation,
  updateGiftsSettings as updateGiftsSettingsMutation,
} from "@/features/gifts/server/mutations";

export async function createGiftItemAction(args: {
  eventId: string;
  slug: string;
  formData: FormData;
}) {
  return createGiftItemMutation(args);
}

export async function updateGiftItemAction(args: {
  eventId: string;
  slug: string;
  itemId: string;
  formData: FormData;
}) {
  return updateGiftItemMutation(args);
}

export async function suggestGiftItemAction(args: {
  eventId: string;
  slug: string;
  targetListId: string;
  formData: FormData;
}) {
  return suggestGiftItemMutation(args);
}

export async function updateGiftSettingsAction(args: {
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
    await updateGiftsSettingsMutation(args);
    return { success: true };
  } catch (error) {
    console.error("Error updating gift settings:", error);
    return { success: false, error: "Erreur lors de l'enregistrement" };
  }
}

export async function deleteGiftAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  const eventId = formData.get("eventId")?.toString();

  if (!itemId || !eventId) {
    throw new Error("Parametres manquants");
  }

  await deleteGiftItemMutation({ eventId, itemId });
}
