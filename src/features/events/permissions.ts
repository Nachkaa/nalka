// src/features/events/permissions.ts

import { prisma } from "@/lib/prisma";
import { EventMemberRole } from "@prisma/client";

/**
 * Helper central : est-ce que ce rôle est admin-like ?
 */
function isAdminRole(role: EventMemberRole) {
  return role === "ADMIN" || role === "OWNER";
}

/**
 * Membership-gated fetch pour une page d'événement complète.
 */
export async function requireEventForUser(slug: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      slug,
      memberships: { some: { userId } },
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

/**
 * Vérifie qu'un user est bien membre d'un event donné.
 * Utilisable par toutes les actions server liées à l'event.
 */
export async function assertUserInEvent(eventId: string, userId: string) {
  const membership = await prisma.eventMember.findFirst({
    where: { eventId, userId },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  return membership;
}

/**
 * Vérifie qu'un user a le droit de gérer un item "bring".
 * Droit = créateur de l'item OU admin/owner de l'événement.
 */
export async function assertCanManageBringItem(itemId: string, userId: string) {
  const item = await prisma.eventBringItem.findUnique({
    where: { id: itemId },
    include: {
      event: {
        include: {
          memberships: true,
        },
      },
    },
  });

  if (!item) throw new Error("Not found");

  const membership = item.event.memberships.find((m) => m.userId === userId);
  if (!membership) throw new Error("Forbidden");

  // Vérifier si l'user est admin/owner OU créateur de l'item
  const isCreator = item.createdById === userId;
  const isAdmin = isAdminRole(membership.role);

  if (!isCreator && !isAdmin) {
    throw new Error("Forbidden");
  }

  return { userId, item, membership };
}
