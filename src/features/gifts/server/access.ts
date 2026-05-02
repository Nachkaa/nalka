import { EventModuleKey, ReservationStatus } from "@prisma/client";

import { requireEnabledModule, requireEventOrganizer } from "@/features/events/access";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type GiftActor = {
  id: string;
  name: string | null;
  email: string;
};

export async function requireGiftActor() {
  const currentUser = await requireCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  return user as GiftActor;
}

export async function requireGiftsMemberAccess(eventId: string, userId?: string) {
  return requireEnabledModule({
    eventId,
    userId,
    key: EventModuleKey.GIFTS,
  });
}

export async function requireGiftsOrganizerAccess(eventId: string, userId?: string) {
  return requireEventOrganizer({
    eventId,
    userId,
  });
}

export async function requireOwnedGiftItemForMutation(args: {
  eventId: string;
  itemId: string;
  userId?: string;
}) {
  const access = await requireGiftsMemberAccess(args.eventId, args.userId);

  const item = await prisma.giftItem.findUnique({
    where: { id: args.itemId },
    include: {
      list: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          eventRelative: {
            select: {
              id: true,
              firstName: true,
            },
          },
        },
      },
      reservations: {
        where: {
          status: { not: ReservationStatus.RELEASED },
        },
        include: {
          byUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!item || item.list.eventId !== access.event.id || item.list.ownerId !== access.userId) {
    throw new Error("Non autorisé");
  }

  return {
    access,
    item,
  };
}

export async function requireGiftReservationTarget(args: {
  eventId: string;
  itemId: string;
  userId?: string;
}) {
  const access = await requireGiftsMemberAccess(args.eventId, args.userId);

  const item = await prisma.giftItem.findUnique({
    where: { id: args.itemId },
    include: {
      list: {
        select: {
          eventId: true,
          ownerId: true,
        },
      },
      reservations: {
        where: {
          status: { not: ReservationStatus.RELEASED },
        },
        select: {
          id: true,
          byUserId: true,
          status: true,
        },
      },
    },
  });

  if (!item || item.list.eventId !== access.event.id) {
    throw new Error("Item introuvable");
  }

  return {
    access,
    item,
  };
}

export async function requireSuggestionTargetList(args: {
  eventId: string;
  targetListId: string;
  userId?: string;
}) {
  const access = await requireGiftsMemberAccess(args.eventId, args.userId);

  const list = await prisma.giftList.findUnique({
    where: { id: args.targetListId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!list || list.eventId !== access.event.id) {
    throw new Error("Liste introuvable");
  }

  if (list.ownerId === access.userId) {
    throw new Error("Tu ne peux pas suggérer une idée sur ta propre liste");
  }

  return {
    access,
    list,
  };
}
