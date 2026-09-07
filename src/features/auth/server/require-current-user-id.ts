import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireCurrentUserId() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.id) {
    const byId = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  if (!session.user.email) throw new Error("Missing email");

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined },
    create: { email: session.user.email, name: session.user.name ?? null },
    select: { id: true },
  });

  return user.id;
}
