"use server";

import { EventModuleKey, EventTimelineMomentKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireEnabledModule } from "@/features/events/access";
import { prisma } from "@/lib/prisma";

type TimelinePayload = {
  eventId: string;
  slug: string;
  momentId?: string;
  title: string;
  kind: EventTimelineMomentKind;
  startsAt: string;
  endsAt?: string;
  locationName?: string;
  locationAddress?: string;
  note?: string;
};

function normalizeText(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parseRequiredTitle(value: string) {
  const title = value.trim();
  if (!title) {
    throw new Error("Le titre est obligatoire");
  }

  return title;
}

function parseDateTimeLocal(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Date et heure manquantes");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date invalide");
  }

  return parsed;
}

function parseOptionalDateTimeLocal(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return parseDateTimeLocal(trimmed);
}

function assertSameDay(startsAt: Date, endsAt: Date) {
  const sameDay =
    startsAt.getFullYear() === endsAt.getFullYear() &&
    startsAt.getMonth() === endsAt.getMonth() &&
    startsAt.getDate() === endsAt.getDate();

  if (!sameDay) {
    throw new Error("Le programme V1 gère uniquement une journée");
  }
}

async function getTimelineWriteContext(eventId: string, slug: string) {
  const access = await requireEnabledModule({
    eventId,
    slug,
    key: EventModuleKey.TIMELINE,
    requireOrganizer: true,
  });

  return access.event;
}

function revalidateTimelinePaths(slug: string) {
  revalidatePath(`/event/${slug}`, "page");
}

export async function createTimelineMoment(
  payload: TimelinePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const event = await getTimelineWriteContext(payload.eventId, payload.slug);
    const title = parseRequiredTitle(payload.title);
    const startsAt = parseDateTimeLocal(payload.startsAt);
    const endsAt = parseOptionalDateTimeLocal(payload.endsAt);

    if (endsAt && endsAt <= startsAt) throw new Error("La fin doit être après le début");
    if (endsAt) assertSameDay(startsAt, endsAt);

    await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.eventTimelineMoment.aggregate({
        where: { eventId: event.id },
        _max: { position: true },
      });

      await tx.eventTimelineMoment.create({
        data: {
          eventId: event.id,
          title,
          kind: payload.kind,
          startsAt,
          endsAt: endsAt ?? null,
          locationName: normalizeText(payload.locationName),
          locationAddress: normalizeText(payload.locationAddress),
          note: normalizeText(payload.note),
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });
    });

    revalidateTimelinePaths(event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function updateTimelineMoment(
  payload: TimelinePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!payload.momentId) throw new Error("Moment introuvable");

    const event = await getTimelineWriteContext(payload.eventId, payload.slug);
    const title = parseRequiredTitle(payload.title);
    const startsAt = parseDateTimeLocal(payload.startsAt);
    const endsAt = parseOptionalDateTimeLocal(payload.endsAt);

    if (endsAt && endsAt <= startsAt) throw new Error("La fin doit être après le début");
    if (endsAt) assertSameDay(startsAt, endsAt);

    const updated = await prisma.eventTimelineMoment.updateMany({
      where: { id: payload.momentId, eventId: event.id },
      data: {
        title,
        kind: payload.kind,
        startsAt,
        endsAt: endsAt ?? null,
        locationName: normalizeText(payload.locationName),
        locationAddress: normalizeText(payload.locationAddress),
        note: normalizeText(payload.note),
      },
    });

    if (updated.count === 0) {
      throw new Error("Moment introuvable");
    }

    revalidateTimelinePaths(event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function deleteTimelineMoment(params: {
  eventId: string;
  slug: string;
  momentId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const event = await getTimelineWriteContext(params.eventId, params.slug);

    const deleted = await prisma.eventTimelineMoment.deleteMany({
      where: { id: params.momentId, eventId: event.id },
    });

    if (deleted.count === 0) {
      throw new Error("Moment introuvable");
    }

    revalidateTimelinePaths(event.slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
