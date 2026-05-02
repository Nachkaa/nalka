"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteEvent(fd: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const eventId = fd.get("eventId")?.toString();
  if (!eventId) throw new Error("Missing eventId");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("User not found");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") throw new Error("Forbidden");

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/event");
  redirect("/event");
}
