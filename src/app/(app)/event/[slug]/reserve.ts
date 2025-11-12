"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma, ReservationStatus } from "@prisma/client";

function parse(formData: FormData) {
  const itemId = formData.get("itemId")?.toString() ?? "";
  const eventId = formData.get("eventId")?.toString() ?? "";
  if (!itemId || !eventId) throw new Error("Missing fields");
  return { itemId, eventId };
}

// Reserve atomically: fails if already RESERVED by anyone.
export async function reserveItem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!me) throw new Error("Unauthorized");
  const { itemId, eventId } = parse(formData);

  // prevent self-reservation (owner reserving own gift)
  const owner = await prisma.giftItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { ownerId: true } } },
  });
  if (!owner) throw new Error("Gift not found");
  if (owner.list.ownerId === me.id) throw new Error("Forbidden");

  try {
    await prisma.reservation.create({
      data: { itemId, byUserId: me.id, status: ReservationStatus.RESERVED },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Already reserved");
    }
    throw e;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event?.slug) revalidatePath(`/event/${event.slug}`);
  return { ok: true };
}

// Only the reserver can cancel their active reservation.
export async function cancelReservation(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!me) throw new Error("Unauthorized");
  const { itemId, eventId } = parse(formData);

  const { count } = await prisma.reservation.deleteMany({
    where: { itemId, byUserId: me.id, status: ReservationStatus.RESERVED },
  });
  if (count === 0) throw new Error("Forbidden");

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event?.slug) revalidatePath(`/event/${event.slug}`);
  return { ok: true };
}
