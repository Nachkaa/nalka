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
  const [assignmentCount, myAssignmentCount, membersCount] = await prisma.$transaction(
    [
      prisma.secretSantaAssignment.count({ where }),
      prisma.secretSantaAssignment.count({ where: { ...where, giverId: access.userId } }),
      prisma.eventMember.count({ where }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );

  return {
    state: myAssignmentCount > 0 ? "assigned" : assignmentCount > 0 ? "not-assigned" : "waiting",
    membersCount,
    canManage: isOrganizerRole(access.membership.role),
    budgetCapCents,
  };
}
