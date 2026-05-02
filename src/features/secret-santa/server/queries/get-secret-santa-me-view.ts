import { EventModuleKey } from "@prisma/client";

import { requireEnabledModule } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

import type { SecretSantaMeView } from "../../types";

export async function getSecretSantaMeView(
  eventId: string,
  userId?: string,
): Promise<SecretSantaMeView | null> {
  const access = await requireEnabledModule({
    eventId,
    userId,
    key: EventModuleKey.SECRET_SANTA,
  });

  const assignment = await prisma.secretSantaAssignment.findUnique({
    where: { eventId_giverId: { eventId: access.event.id, giverId: access.userId } },
    select: { receiverId: true },
  });

  if (!assignment) {
    return null;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: assignment.receiverId },
    select: { id: true, name: true, email: true },
  });

  const list = await prisma.giftList.findFirst({
    where: { eventId: access.event.id, ownerId: assignment.receiverId },
    select: {
      id: true,
      items: {
        select: { id: true, title: true, url: true, note: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  return {
    receiver: receiver ?? { id: assignment.receiverId, name: null, email: null },
    listId: list?.id ?? null,
    receiverItems: list?.items ?? [],
  };
}
