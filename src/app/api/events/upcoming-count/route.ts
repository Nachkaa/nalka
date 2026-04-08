import { auth } from "@/auth";
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

  const count = await prisma.event.count({
    where: {
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
  });

  return Response.json({ count });
}
