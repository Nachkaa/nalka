// src/features/events/permissions.ts

import { requireEventMembership } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

/**
 * Membership-gated fetch pour une page d'événement complète.
 */
export async function requireEventForUser(slug: string, userId: string) {
  const access = await requireEventMembership({ slug, userId });

  const event = await prisma.event.findFirst({
    where: {
      id: access.event.id,
    },
    select: {
      // scalars used by the event page
      id: true,
      slug: true,
      title: true,
      description: true,
      eventOn: true,
      eventTime: true,
      location: true,
      ownerId: true,
      colorHex: true,
      scheduleMode: true,
      locationMode: true,

      giftMode: true,

      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          key: true,
          enabled: true,
          position: true,
          giftsSettings: {
            select: {
              isNoSpoil: true,
              isAnonReservations: true,
              isSecondHandOk: true,
              isHandmadeOk: true,
              budgetCapCents: true,
            },
          },
          secretSantaSettings: {
            select: {
              budgetCapCents: true,
            },
          },
          overviewSettings: {
            select: {
              rsvpRequired: true,
            },
          },
        },
      },

      // relations
      memberships: {
        select: {
          id: true,
          userId: true,
          role: true,
          rsvpStatus: true,
          rsvpRespondedAt: true,
          user: true,
        },
      },
      relatives: {
        include: {
          managedProfile: { include: { owner: true } },
          createdBy: true,
        },
      },
    },
  });

  return event;
}
