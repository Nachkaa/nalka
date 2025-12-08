import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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
      memberships: {
        some: { userId },
      },
    },
    include: {
      memberships: {
        include: { user: true },
      },
      lists: {
        include: {
          owner: true,
          eventRelative: true,
          items: {
            include: {
              reservations: {
                include: { byUser: true },
              },
            },
          },
        },
      },
      relatives: {
        include: {
          managedProfile: {
            include: {
              owner: true,
            },
          },
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
 * Vérifie qu'un user (depuis la session) a le droit de gérer un item "bring".
 * Droit = créateur de l'item OU admin/owner de l'événement.
 */
export async function assertCanManageBringItem(itemId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

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

  const membership = item.event.memberships.find(
    (m) => m.userId === userId,
  );
  if (!membership) throw new Error("Forbidden");

  const adminLike = isAdminRole(membership.role);

  if (!adminLike) {
    throw new Error("Forbidden");
  }

  return { userId, item, membership };
}
