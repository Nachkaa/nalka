import { prisma } from "@/lib/prisma";

export async function requireEventForUser(slug: string, userId: string) {
  // membership-gated fetch
  const event = await prisma.event.findFirst({
    where: { slug, memberships: { some: { userId } } },
    include: {
      memberships: true,
      lists: {
        include: {
          owner: true,
          items: { include: { reservations: { include: { byUser: true } } } },
        },
      },
    },
  });
  return event; // null if no access
}
