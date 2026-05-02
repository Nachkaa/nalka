import { prisma } from "@/lib/prisma";

import { requireGiftActor, requireSuggestionTargetList } from "../access";
import {
  applyGiftRateLimit,
  notifySuggestedGiftOwner,
  parseGiftFormInput,
  revalidateGiftPaths,
  resolveGiftImage,
} from "./shared";

export async function suggestGiftItem(args: {
  eventId: string;
  slug: string;
  targetListId: string;
  formData: FormData;
}) {
  const user = await requireGiftActor();
  await applyGiftRateLimit({ action: "suggest", userId: user.id, max: 50 });

  const input = parseGiftFormInput(args.formData);
  const imagePath = await resolveGiftImage(args.formData, null);
  const { list } = await requireSuggestionTargetList({
    eventId: args.eventId,
    targetListId: args.targetListId,
    userId: user.id,
  });

  const event = await prisma.event.findUnique({
    where: { id: args.eventId },
    select: { title: true },
  });

  const gift = await prisma.giftItem.create({
    data: {
      listId: list.id,
      title: input.title,
      note: input.note,
      url: input.url,
      imagePath,
      isSuggestion: true,
      suggestedByUserId: user.id,
    },
    select: { id: true },
  });

  await notifySuggestedGiftOwner({
    ownerEmail: list.owner?.email,
    eventTitle: event?.title ?? "Événement",
    giftTitle: input.title,
    slug: args.slug,
  });

  revalidateGiftPaths(args.slug);

  return { id: gift.id };
}
