"use server";

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Invalid name");

  await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  });

  return { success: true };
}

export async function deleteMyAccount(): Promise<{ ok: true }> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return { ok: true };
  const userId = me.id;

  await prisma.$transaction(async (tx) => {
    const memberEventIds = await tx.eventMember.findMany({
      where: { userId, event: { ownerId: { not: userId } } },
      select: { eventId: true },
    });

    for (const { eventId } of memberEventIds) {
      const outPair = await tx.secretSantaAssignment.findUnique({
        where: { eventId_giverId: { eventId, giverId: userId } },
      });
      const inPair = await tx.secretSantaAssignment.findFirst({
        where: { eventId, receiverId: userId },
      });

      if (inPair && outPair) {
        if (outPair.receiverId === inPair.giverId) {
          await tx.secretSantaAssignment.delete({ where: { id: inPair.id } });
          await tx.secretSantaAssignment.delete({ where: { id: outPair.id } });
        } else {
          await tx.secretSantaAssignment.update({
            where: { id: inPair.id },
            data: { receiverId: outPair.receiverId },
          });
          await tx.secretSantaAssignment.delete({ where: { id: outPair.id } });
        }
      } else {
        if (inPair) await tx.secretSantaAssignment.delete({ where: { id: inPair.id } });
        if (outPair) await tx.secretSantaAssignment.delete({ where: { id: outPair.id } });
      }
    }

    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/event");
  return { ok: true };
}
