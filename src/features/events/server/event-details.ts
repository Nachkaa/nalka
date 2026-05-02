"use server";

import { EventScheduleMode } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireEventOrganizer } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

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

export async function setEventLocationBySlug(slug: string, location: string) {
  const trimmed = (location ?? "").trim();
  if (!trimmed) throw new Error("Lieu manquant");

  const access = await requireEventOrganizer({ slug });

  await prisma.event.update({
    where: { id: access.event.id },
    data: { location: trimmed, locationMode: "EXACT" },
  });

  revalidatePath(`/event/${access.event.slug}`);
}

export async function setEventDateBySlug(slug: string, iso: string) {
  const trimmed = iso.trim();
  if (!trimmed) throw new Error("Date manquante");

  const eventOn = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(eventOn.getTime())) throw new Error("Date invalide");

  const access = await requireEventOrganizer({ slug });

  await prisma.$transaction(async (tx) => {
    const currentEvent = await tx.event.findUnique({
      where: { id: access.event.id },
      select: { eventOn: true },
    });

    await tx.event.update({
      where: { id: access.event.id },
      data: { eventOn, scheduleMode: EventScheduleMode.EXACT },
    });

    await shiftTimelineMomentsForEventDateChange(
      tx,
      access.event.id,
      currentEvent?.eventOn ?? null,
      eventOn,
    );
  });

  revalidatePath(`/event/${access.event.slug}`);
}
