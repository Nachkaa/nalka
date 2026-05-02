import { ReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { requireGiftActor, requireGiftsMemberAccess } from "../access";
import { applyGiftRateLimit } from "./shared";

export async function unreserveGiftItem(args: {
  eventId: string;
  slug: string;
  itemId: string;
}) {
  const user = await requireGiftActor();
  await requireGiftsMemberAccess(args.eventId, user.id);
  await applyGiftRateLimit({ action: "unreserve", userId: user.id, max: 50 });

  const reservation = await prisma.reservation.findFirst({
    where: {
      itemId: args.itemId,
      byUserId: user.id,
      status: ReservationStatus.RESERVED,
    },
    include: {
      item: {
        include: {
          list: {
            select: {
              eventId: true,
            },
          },
        },
      },
    },
  });

  if (!reservation || reservation.item.list.eventId !== args.eventId) {
    throw new Error("Réservation introuvable");
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: ReservationStatus.RELEASED },
  });
}
