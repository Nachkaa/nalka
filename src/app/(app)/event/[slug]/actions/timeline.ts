"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventTimelineMomentKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

async function getTimelineWriteContext(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      modules: {
        some: {
          key: "TIMELINE",
          enabled: true,
        },
      },
      memberships: {
        some: {
          userId: session.user.id,
          role: { in: ["ADMIN", "OWNER"] },
        },
      },
    },
    select: { slug: true },
  });

  if (!event) {
    throw new Error("Accès refusé");
  }

  return { slug: event.slug };
}

async function revalidateTimelinePaths(slug: string) {
  revalidatePath(`/event/${slug}`, "page");
}

export async function createTimelineMoment(
  payload: TimelinePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { slug } = await getTimelineWriteContext(payload.eventId);
    const title = parseRequiredTitle(payload.title);
    const startsAt = parseDateTimeLocal(payload.startsAt);
    const endsAt = parseOptionalDateTimeLocal(payload.endsAt);

    if (endsAt && endsAt <= startsAt) throw new Error("La fin doit être après le début");
    if (endsAt) assertSameDay(startsAt, endsAt);

    await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.eventTimelineMoment.aggregate({
        where: { eventId: payload.eventId },
        _max: { position: true },
      });

      const createData = {
        eventId: payload.eventId,
        title,
        kind: payload.kind,
        startsAt,
        ...(endsAt ? { endsAt } : { endsAt: null }),
        locationName: normalizeText(payload.locationName),
        locationAddress: normalizeText(payload.locationAddress),
        note: normalizeText(payload.note),
        position: (maxPosition._max.position ?? -1) + 1,
      } as Parameters<typeof tx.eventTimelineMoment.create>[0]["data"];

      await tx.eventTimelineMoment.create({
        data: createData,
      });
    });

    await revalidateTimelinePaths(slug);
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

    const { slug } = await getTimelineWriteContext(payload.eventId);
    const title = parseRequiredTitle(payload.title);
    const startsAt = parseDateTimeLocal(payload.startsAt);
    const endsAt = parseOptionalDateTimeLocal(payload.endsAt);

    if (endsAt && endsAt <= startsAt) throw new Error("La fin doit être après le début");
    if (endsAt) assertSameDay(startsAt, endsAt);

    const updateData = {
      title,
      kind: payload.kind,
      startsAt,
      ...(endsAt ? { endsAt } : { endsAt: null }),
      locationName: normalizeText(payload.locationName),
      locationAddress: normalizeText(payload.locationAddress),
      note: normalizeText(payload.note),
    } as Parameters<typeof prisma.eventTimelineMoment.updateMany>[0]["data"];

    const updated = await prisma.eventTimelineMoment.updateMany({
      where: { id: payload.momentId, eventId: payload.eventId },
      data: updateData,
    });

    if (updated.count === 0) {
      throw new Error("Moment introuvable");
    }

    await revalidateTimelinePaths(slug);
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
    const { slug } = await getTimelineWriteContext(params.eventId);

    const deleted = await prisma.eventTimelineMoment.deleteMany({
      where: { id: params.momentId, eventId: params.eventId },
    });

    if (deleted.count === 0) {
      throw new Error("Moment introuvable");
    }

    await revalidateTimelinePaths(slug);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
