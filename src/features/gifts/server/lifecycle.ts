import { EventGiftMode, EventModuleKey, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function getGiftLifecycleState(tx: Prisma.TransactionClient, eventId: string) {
  const event = await tx.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      ownerId: true,
      giftMode: true,
      title: true,
      modules: {
        where: { key: EventModuleKey.GIFTS },
        select: { enabled: true },
        take: 1,
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
}

export async function syncGiftListsForEvent(tx: Prisma.TransactionClient, eventId: string) {
  const event = await getGiftLifecycleState(tx, eventId);

  const [members, relatives, existingLists] = await Promise.all([
    tx.eventMember.findMany({
      where: { eventId },
      select: { userId: true },
    }),
    tx.eventRelative.findMany({
      where: { eventId },
      select: { id: true, firstName: true },
    }),
    tx.giftList.findMany({
      where: { eventId },
      select: { id: true, ownerId: true, eventRelativeId: true },
    }),
  ]);

  const hasListByOwner = new Set(
    existingLists.filter((list) => list.ownerId != null).map((list) => list.ownerId as string),
  );
  const hasListByRelative = new Set(
    existingLists
      .filter((list) => list.eventRelativeId != null)
      .map((list) => list.eventRelativeId as string),
  );

  if (event.giftMode === EventGiftMode.HOST_LIST) {
    if (!hasListByOwner.has(event.ownerId)) {
      await tx.giftList.create({
        data: {
          ownerId: event.ownerId,
          eventId: event.id,
          title: event.title || "Ma liste",
        },
      });
    }
    return;
  }

  for (const member of members) {
    if (!hasListByOwner.has(member.userId)) {
      await tx.giftList.create({
        data: {
          ownerId: member.userId,
          eventId: event.id,
          title: "Ma liste",
        },
      });
    }
  }

  for (const relative of relatives) {
    if (!hasListByRelative.has(relative.id)) {
      await tx.giftList.create({
        data: {
          eventId: event.id,
          eventRelativeId: relative.id,
          title: relative.firstName ? `Liste de ${relative.firstName}` : "Ma liste",
        },
      });
    }
  }
}

export async function syncGiftListsIfEnabled(tx: Prisma.TransactionClient, eventId: string) {
  const event = await getGiftLifecycleState(tx, eventId);

  if (event.modules[0]?.enabled !== true) {
    return;
  }

  await syncGiftListsForEvent(tx, eventId);
}

export async function ensureGiftListForJoinedMember(
  tx: Prisma.TransactionClient,
  args: { eventId: string; userId: string },
) {
  const event = await getGiftLifecycleState(tx, args.eventId);

  if (event.modules[0]?.enabled !== true || event.giftMode !== EventGiftMode.PERSONAL_LISTS) {
    return;
  }

  const existingList = await tx.giftList.findFirst({
    where: {
      eventId: args.eventId,
      ownerId: args.userId,
      eventRelativeId: null,
    },
    select: { id: true },
  });

  if (!existingList) {
    await tx.giftList.create({
      data: {
        eventId: args.eventId,
        ownerId: args.userId,
        title: "Ma liste",
      },
    });
  }
}

export async function deleteGiftListsForMember(
  tx: Prisma.TransactionClient,
  args: { eventId: string; userId: string },
) {
  await tx.giftList.deleteMany({
    where: {
      eventId: args.eventId,
      ownerId: args.userId,
    },
  });
}

export async function deleteGiftListsForRelative(
  tx: Prisma.TransactionClient,
  args: { eventId: string; relativeId: string },
) {
  await tx.giftList.deleteMany({
    where: {
      eventId: args.eventId,
      eventRelativeId: args.relativeId,
    },
  });
}

export async function clearGiftListsForEvent(
  tx: Prisma.TransactionClient,
  args: { eventId: string },
) {
  await tx.giftList.deleteMany({
    where: { eventId: args.eventId },
  });
}

export async function resolveTargetGiftListForCurrentUser(eventId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await getGiftLifecycleState(tx, eventId);

    if (event.modules[0]?.enabled !== true) {
      throw new Error("Les cadeaux sont désactivés pour cet événement.");
    }

    await syncGiftListsForEvent(tx, event.id);

    const targetList =
      event.giftMode === EventGiftMode.HOST_LIST
        ? await tx.giftList.findFirst({
            where: {
              eventId: event.id,
              ownerId: event.ownerId,
            },
            select: { id: true },
          })
        : await tx.giftList.findFirst({
            where: {
              eventId: event.id,
              ownerId: userId,
            },
            select: { id: true },
          });

    if (!targetList) {
      throw new Error("Aucune liste de cadeaux disponible.");
    }

    return targetList;
  });
}
