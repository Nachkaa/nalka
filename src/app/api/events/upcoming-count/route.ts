import { auth } from "@/auth";
import { getEventDateKey } from "@/features/events/event-dates";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  let userId = session?.user?.id ?? null;

  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) {
    return Response.json({ count: 0 });
  }

  const today = new Date(`${getEventDateKey()}T00:00:00.000Z`);
  const count = await prisma.event.count({
    where: {
      AND: [
        { OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] },
        { OR: [{ eventOn: null }, { eventOn: { gte: today } }] },
      ],
    },
  });

  return Response.json({ count });
}
