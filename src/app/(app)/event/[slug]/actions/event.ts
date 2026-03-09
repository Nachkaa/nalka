// app/(app)/event/[slug]/actions/event.ts

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventMemberRole, EventScheduleMode } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function assertAdminAccessBySlug(slug: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      memberships: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  const role = event?.memberships[0]?.role;
  if (!role || (role !== EventMemberRole.OWNER && role !== EventMemberRole.ADMIN)) {
    throw new Error("Forbidden");
  }

  return event.id;
}

// ─────────────────────────────────────────────────────────────
// Définir le lieu
// ─────────────────────────────────────────────────────────────
export async function setEventLocationBySlug(slug: string, location: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const trimmed = (location ?? "").trim();
  if (!trimmed) throw new Error("Lieu manquant");

  await assertAdminAccessBySlug(slug, userId);

  await prisma.event.update({
    where: { slug },
    data: { location: trimmed, locationMode: "EXACT" },
  });

  revalidatePath(`/event/${slug}`);
}

// ────────────────────────────────────────────────────────────────────────────────
// Définir la date
// ────────────────────────────────────────────────────────────────────────────────

export async function setEventDateBySlug(slug: string, iso: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const trimmed = iso.trim();
  if (!trimmed) throw new Error("Date manquante");

  const eventOn = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(eventOn.getTime())) throw new Error("Date invalide");

  await assertAdminAccessBySlug(slug, userId);

  await prisma.event.update({
    where: { slug },
    data: { eventOn, scheduleMode: EventScheduleMode.EXACT },
  });

  revalidatePath(`/event/${slug}`);
}

// ─────────────────────────────────────────────────────────────
// Supprimer un événement
// ─────────────────────────────────────────────────────────────
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
