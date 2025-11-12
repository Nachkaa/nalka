import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("unauthorized", { status: 401 });

  let userId = session.user.id as string | undefined;
  if (!userId && session.user.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    userId = u?.id;
  }
  if (!userId) return new NextResponse("no-user", { status: 400 });

  const data = await prisma.event.findMany({
    where: {
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, ownerId: true, eventOn: true },
  });

  return NextResponse.json({ userId, count: data.length, data });
}
    