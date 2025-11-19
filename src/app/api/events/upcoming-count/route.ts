import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ count: 0 });
  }

  // On part du début de la journée pour éviter les soucis d’heure
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.event.count({
    where: {
      eventOn: { gte: today },
      memberships: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  return Response.json({ count });
}
