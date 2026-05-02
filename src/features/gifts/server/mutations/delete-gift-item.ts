import { requireGiftActor, requireOwnedGiftItemForMutation } from "../access";
import { applyGiftRateLimit, notifyGiftReservers, revalidateGiftPaths } from "./shared";

import { prisma } from "@/lib/prisma";

export async function deleteGiftItem(args: { eventId: string; itemId: string }) {
  const user = await requireGiftActor();
  await applyGiftRateLimit({ action: "delete", userId: user.id, max: 30 });

  const { item } = await requireOwnedGiftItemForMutation({
    eventId: args.eventId,
    itemId: args.itemId,
    userId: user.id,
  });

  const ownerName =
    item.list.owner?.name ??
    item.list.owner?.email ??
    item.list.eventRelative?.firstName ??
    user.name ??
    "Un proche";

  if (item.reservations.length > 0) {
    await notifyGiftReservers({
      reservations: item.reservations,
      giftTitle: item.title,
      eventTitle: item.list.event.title,
      ownerName,
    });
  }

  await prisma.giftItem.delete({
    where: { id: item.id },
  });

  revalidateGiftPaths(item.list.event.slug);
}
