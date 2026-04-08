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

function getUtcDateKey(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getCalendarDayDelta(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((getUtcDateKey(to) - getUtcDateKey(from)) / msPerDay);
}

function shiftUtcDateByDays(value: Date, dayDelta: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + dayDelta);
  return next;
}

async function shiftTimelineMomentsForEventDateChange(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  eventId: string,
  previousEventOn: Date | null,
  nextEventOn: Date | null,
) {
  if (!previousEventOn || !nextEventOn) return;

  const dayDelta = getCalendarDayDelta(previousEventOn, nextEventOn);
  if (dayDelta === 0) return;

  const moments = await tx.eventTimelineMoment.findMany({
    where: { eventId },
    select: { id: true, startsAt: true, endsAt: true },
  });

  if (moments.length === 0) return;

  await Promise.all(
    moments.map((moment) =>
      tx.eventTimelineMoment.update({
        where: { id: moment.id },
        data: {
          startsAt: shiftUtcDateByDays(moment.startsAt, dayDelta),
          endsAt: moment.endsAt ? shiftUtcDateByDays(moment.endsAt, dayDelta) : null,
        },
      }),
    ),
  );
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

  const eventId = await assertAdminAccessBySlug(slug, userId);

  await prisma.$transaction(async (tx) => {
    const currentEvent = await tx.event.findUnique({
      where: { id: eventId },
      select: { eventOn: true },
    });

    await tx.event.update({
      where: { id: eventId },
      data: { eventOn, scheduleMode: EventScheduleMode.EXACT },
    });

    await shiftTimelineMomentsForEventDateChange(tx, eventId, currentEvent?.eventOn ?? null, eventOn);
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
