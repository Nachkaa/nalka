// extend payload with receiverItems (safe: only if caller is assigned giver)
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { eventId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const { eventId } = await ctx.params;

  const assign = await prisma.secretSantaAssignment.findUnique({
    where: { eventId_giverId: { eventId, giverId: me.id } },
    select: { receiverId: true },
  });
  if (!assign) return NextResponse.json({ error: "Aucun tirage" }, { status: 404 });

  const receiver = await prisma.user.findUnique({
    where: { id: assign.receiverId },
    select: { id: true, name: true, email: true },
  });

  const list = await prisma.giftList.findFirst({
    where: { eventId, ownerId: assign.receiverId },
    select: {
      id: true,
      items: {
        select: { id: true, title: true, url: true, note: true },
        orderBy: { createdAt: "desc" },
        take: 8, // cap to keep banner compact
      },
    },
  });

  return NextResponse.json({
    receiver: receiver ?? { id: assign.receiverId, name: null, email: null },
    listId: list?.id ?? null,
    receiverItems: list?.items ?? [],
  });
}
