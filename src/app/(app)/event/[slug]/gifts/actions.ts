"use server";

import { redirect } from "next/navigation";

import {
  createGiftItem as createGiftItemMutation,
  deleteGiftItem,
  reserveGiftItem,
  suggestGiftItem as suggestGiftItemMutation,
  unreserveGiftItem,
  updateGiftItem as updateGiftItemMutation,
} from "@/features/gifts/server/mutations";

export async function addGift(eventId: string, slug: string, formData: FormData) {
  await createGiftItemMutation({ eventId, slug, formData });
  redirect(`/event/${slug}/gifts`);
}

export async function updateGift(
  eventId: string,
  slug: string,
  itemId: string,
  formData: FormData,
) {
  await updateGiftItemMutation({ eventId, slug, itemId, formData });
  redirect(`/event/${slug}/gifts`);
}

export async function createGiftItem(eventId: string, slug: string, formData: FormData) {
  return createGiftItemMutation({ eventId, slug, formData });
}

export async function updateGiftItem(
  eventId: string,
  slug: string,
  itemId: string,
  formData: FormData,
) {
  return updateGiftItemMutation({ eventId, slug, itemId, formData });
}

export async function deleteGift(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  const eventId = formData.get("eventId")?.toString();

  if (!itemId || !eventId) {
    throw new Error("Paramètres manquants");
  }

  await deleteGiftItem({ eventId, itemId });
}

export async function reserveGift(eventId: string, slug: string, itemId: string) {
  await reserveGiftItem({ eventId, slug, itemId });
}

export async function unreserveGift(eventId: string, slug: string, itemId: string) {
  await unreserveGiftItem({ eventId, slug, itemId });
}

export async function suggestGiftItem(
  eventId: string,
  slug: string,
  targetListId: string,
  formData: FormData,
) {
  return suggestGiftItemMutation({ eventId, slug, targetListId, formData });
}
