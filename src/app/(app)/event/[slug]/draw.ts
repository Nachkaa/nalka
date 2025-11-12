"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const Input = z.object({
  eventId: z.string().min(1),
  slug: z.string().min(1),
});

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((Math.random() * (i + 1)) as number);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function makeDerangement(ids: string[]): string[] {
  const receivers = [...ids];
  shuffleInPlace(receivers);

  // Corrige les auto-assignations en un passage
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === receivers[i]) {
      const j = (i + 1) % ids.length;
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
  }

  // Cas pathologique rare: encore un self après swap (peut arriver si n=1)
  if (ids.length <= 1 || ids.some((id, i) => id === receivers[i])) {
    throw new Error("Tirage impossible: nombre de participants insuffisant.");
  }

  return receivers;
}

async function assertAdmin(eventId: string, userEmail: string) {
  const me = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  if (!me) throw new Error("Utilisateur introuvable");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Interdit");
  }
  return me.id;
}

export async function launchDraw(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const parsed = Input.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) throw new Error("Champs requis");
  const { eventId, slug } = parsed.data;

  await assertAdmin(eventId, session.user.email);

  // Récupère les participants effectifs (ceux qui ont une liste dans l'événement)
  const eventRow = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      lists: {
        select: { ownerId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!eventRow) throw new Error("Événement introuvable");

  const participantIds = Array.from(new Set(eventRow.lists.map((l) => l.ownerId)));
    if (participantIds.length < 2) throw new Error("Au moins 2 participants requis");

  const receivers = makeDerangement(participantIds);

  await prisma.$transaction(async (tx) => {
   await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
   await tx.secretSantaAssignment.createMany({
     data: participantIds.map((giverId, i) => ({
       eventId,
       giverId,
       receiverId: receivers[i],
     })),
   });
 });

  // Pas de spoil: on ne renvoie rien, juste revalidate
  revalidatePath(`/event/${slug}`);
}
