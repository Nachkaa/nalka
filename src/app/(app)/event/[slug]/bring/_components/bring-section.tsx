// app/(app)/event/[slug]/bring/_components/bring-section.tsx

import { prisma } from "@/lib/prisma";
import { BringClient } from "./bring-client";

type BringSectionProps = {
  eventId: string;
  slug: string;
  currentUserId: string;
};

export async function BringSection({ eventId, slug, currentUserId }: BringSectionProps) {
  // ✅ Fetch parallèle des données nécessaires
  const [items, membership, members] = await Promise.all([
    // Items avec leurs bringers
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

    // ✅ Membership de l'utilisateur courant (EventMember)
    prisma.eventMember.findUnique({
      where: {
        userId_eventId: { userId: currentUserId, eventId },
      },
      select: {
        role: true,
      },
    }),

    // ✅ Tous les membres de l'événement
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

  // ✅ Sécurité : si pas de membership, on ne devrait même pas être là
  if (!membership) {
    return null;
  }

  // ✅ Mapping des données pour le type client
  const mappedItems = items.map((item) => ({
    id: item.id,
    label: item.label,
    note: item.note,
    category: item.category!,
    createdById: item.createdById,
    bringers: item.bringers.map((b) => ({
      id: b.id,
      userId: b.userId!,
      user: b.user
        ? {
            name: b.user.name,
            email: b.user.email,
          }
        : null,
    })),
  }));

  const mappedMembers = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    user: m.user
      ? {
          name: m.user.name,
          email: m.user.email,
        }
      : null,
  }));

  // ✅ Délégation au Client Component
  return (
    <BringClient
      eventId={eventId}
      slug={slug}
      items={mappedItems}
      members={mappedMembers}
      currentUserId={currentUserId}
      userRole={membership.role}
    />
  );
}
