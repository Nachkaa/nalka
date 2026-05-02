import type { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { PotluckItem, PotluckParticipant } from "../../types";

export async function getEventPotluckData(eventId: string, currentUserId: string): Promise<{
  userRole: EventMemberRole;
  items: PotluckItem[];
  members: PotluckParticipant[];
}> {
  const [items, membership, members] = await Promise.all([
    prisma.eventBringItem.findMany({
      where: { eventId },
      include: {
        bringers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.eventMember.findUnique({
      where: {
        userId_eventId: { userId: currentUserId, eventId },
      },
      select: {
        role: true,
      },
    }),
    prisma.eventMember.findMany({
      where: { eventId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  if (!membership) {
    throw new Error("Forbidden");
  }

  return {
    userRole: membership.role,
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      note: item.note,
      category: item.category!,
      createdById: item.createdById,
      bringers: item.bringers.map((bringer) => ({
        id: bringer.id,
        userId: bringer.userId!,
        user: bringer.user
          ? {
              name: bringer.user.name,
              email: bringer.user.email,
            }
          : null,
      })),
    })),
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      user: member.user
        ? {
            name: member.user.name,
            email: member.user.email,
          }
        : null,
    })),
  };
}
