import { requireGiftActor, requireOwnedGiftItemForMutation } from "../access";
import {
  applyGiftRateLimit,
  notifyGiftReservers,
  parseGiftFormInput,
  revalidateGiftPaths,
  resolveGiftImage,
} from "./shared";

import { prisma } from "@/lib/prisma";

export async function updateGiftItem(args: {
  eventId: string;
  slug: string;
  itemId: string;
  formData: FormData;
}) {
  const user = await requireGiftActor();
  await applyGiftRateLimit({ action: "update", userId: user.id, max: 50 });

  const input = parseGiftFormInput(args.formData);
  const { item } = await requireOwnedGiftItemForMutation({
    eventId: args.eventId,
    itemId: args.itemId,
    userId: user.id,
  });

  const imagePath = await resolveGiftImage(args.formData, item.imagePath);

  await prisma.giftItem.update({
    where: { id: item.id },
    data: {
      title: input.title,
      note: input.note,
      url: input.url,
      imagePath,
    },
  });

  if (item.reservations.length > 0) {
    await notifyGiftReservers({
      reservations: item.reservations,
      giftTitle: item.title,
      eventTitle: item.list.event.title,
      ownerName: item.list.owner?.name ?? user.name ?? "Organisateur",
    });
  }

  revalidateGiftPaths(args.slug);

  return { id: item.id };
}
