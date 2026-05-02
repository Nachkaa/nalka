"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { suggestGiftItem } from "@/features/gifts/server/mutations";

export async function SuggestGiftAction(slug: string, listId: string, formData: FormData) {
  const list = await prisma.giftList.findUnique({
    where: { id: listId },
    select: { eventId: true },
  });

  if (!list) {
    throw new Error("Liste introuvable");
  }

  await suggestGiftItem({
    eventId: list.eventId,
    slug,
    targetListId: listId,
    formData,
  });

  redirect(`/event/${slug}`);
}
