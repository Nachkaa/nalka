import "server-only";

import { EventModuleKey, Prisma } from "@prisma/client";

import { isOrganizerRole, requireEnabledModule } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

import type { SecretSantaOverview } from "../../overview";

export async function getSecretSantaOverview({
  eventId,
  userId,
  budgetCapCents,
}: {
  eventId: string;
  userId: string;
  budgetCapCents: number | null;
}): Promise<SecretSantaOverview> {
  const access = await requireEnabledModule({ eventId, userId, key: EventModuleKey.SECRET_SANTA });
  const where = { eventId: access.event.id };
  return prisma.$transaction(
    async (tx): Promise<SecretSantaOverview> => {
      const [assignmentCount, myAssignment, membersCount] = await Promise.all([
        tx.secretSantaAssignment.count({ where }),
        tx.secretSantaAssignment.findUnique({
          where: { eventId_giverId: { ...where, giverId: access.userId } },
          select: { receiverId: true },
        }),
        tx.eventMember.count({ where }),
      ]);
      const summary = {
        membersCount,
        canManage: isOrganizerRole(access.membership.role),
        budgetCapCents,
      };

      if (myAssignment) {
        const recipient = await tx.user.findUnique({
          where: { id: myAssignment.receiverId },
          select: { name: true, email: true },
        });
        return {
          ...summary,
          state: "assigned",
          recipientLabel: recipient?.name?.trim() || recipient?.email?.trim() || "un participant",
        };
      }

      return { ...summary, state: assignmentCount > 0 ? "not-assigned" : "waiting" };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
