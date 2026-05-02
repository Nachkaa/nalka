import { ReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { requireGiftActor, requireGiftReservationTarget } from "../access";
import { applyGiftRateLimit } from "./shared";

export async function reserveGiftItem(args: {
  eventId: string;
  slug: string;
  itemId: string;
}) {
  const user = await requireGiftActor();
  await applyGiftRateLimit({ action: "reserve", userId: user.id, max: 50 });

  const { item } = await requireGiftReservationTarget({
    eventId: args.eventId,
    itemId: args.itemId,
    userId: user.id,
  });

  if (item.list.ownerId === user.id) {
    throw new Error("Tu ne peux pas réserver ton propre cadeau");
  }

  const reservedByOther = item.reservations.find((reservation) => reservation.byUserId !== user.id);
  if (reservedByOther) {
    throw new Error("Ce cadeau est déjà réservé");
  }

  const reservedByMe = item.reservations.find((reservation) => reservation.byUserId === user.id);
  if (!reservedByMe) {
    await prisma.reservation.create({
      data: {
        itemId: args.itemId,
        byUserId: user.id,
        status: ReservationStatus.RESERVED,
      },
    });
  }
}
