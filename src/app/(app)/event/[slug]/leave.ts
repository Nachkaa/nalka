"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function leaveEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const eventId = formData.get("eventId")?.toString();
  if (!eventId) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership) throw new Error("Non membre");
  if (membership.role === "OWNER") throw new Error("Le propriétaire ne peut pas quitter");
  // if you want admins blocked too, keep this:
  // if (membership.role === "ADMIN") throw new Error("Un admin ne peut pas quitter");

  await prisma.$transaction(async (tx) => {
    // Secret-Santa: rewire C→B, delete A→B, or purge links if partial
    const aToB = await tx.secretSantaAssignment.findUnique({
      where: { eventId_giverId: { eventId, giverId: me.id } },
      select: { receiverId: true },
    });
    const cToA = await tx.secretSantaAssignment.findFirst({
      where: { eventId, receiverId: me.id },
      select: { giverId: true },
    });

    if (aToB && cToA) {
      await tx.secretSantaAssignment.update({
        where: { eventId_giverId: { eventId, giverId: cToA.giverId } },
        data: { receiverId: aToB.receiverId },
      });
      await tx.secretSantaAssignment.delete({
        where: { eventId_giverId: { eventId, giverId: me.id } },
      });
    } else {
      await tx.secretSantaAssignment.deleteMany({
        where: { eventId, OR: [{ giverId: me.id }, { receiverId: me.id }] },
      });
    }

    // If <2 members remain, wipe all assignments
    const remaining = await tx.eventMember.count({
      where: { eventId, NOT: { userId: me.id } },
    });
    if (remaining < 2) {
      await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    }

    // Delete user data in this event
    await tx.giftList.deleteMany({ where: { ownerId: me.id, eventId } });
    await tx.reservation.deleteMany({
      where: { byUserId: me.id, item: { list: { eventId } } },
    });

    await tx.eventMember.delete({
      where: { userId_eventId: { userId: me.id, eventId } },
    });
  });

  revalidatePath("/event");
  redirect("/event");
}
