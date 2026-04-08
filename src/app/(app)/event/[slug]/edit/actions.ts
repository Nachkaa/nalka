"use server";

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventGiftMode, EventMemberRole } from "@prisma/client";
import { syncGiftListsForEvent } from "@/domain/gift-lists";
import { MODULE_POSITIONS } from "@/features/events/module-positions";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeEventTime(value: FormDataEntryValue | null | undefined) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (!TIME_REGEX.test(s)) throw new Error("Horaire invalide (HH:mm).");
  return s;
}

function toPrismaGiftMode(mode: "host-list" | "personal-lists"): EventGiftMode {
  switch (mode) {
    case "host-list":
      return "HOST_LIST";
    case "personal-lists":
    default:
      return "PERSONAL_LISTS";
  }
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

async function shiftTimelineMomentsForEventDateChange(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], eventId: string, previousEventOn: Date | null, nextEventOn: Date | null) {
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

export async function updateEvent(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "").trim() || null;
  const hasTimeField = formData.has("eventTime") || formData.has("time");
  const eventTime = hasTimeField
    ? normalizeEventTime(formData.get("eventTime") ?? formData.get("time"))
    : undefined;

  if (!title || !date) throw new Error("Champs requis manquants");
  const eventOn = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(eventOn.getTime())) throw new Error("Date invalide");

  const giftModeRaw = String(formData.get("rules.mode") ?? "");
  const giftMode =
    giftModeRaw === "host-list" || giftModeRaw === "personal-lists"
      ? giftModeRaw
      : "personal-lists";
  // Visibilité + préférences
  const isNoSpoil = formData.get("rules.isNoSpoil") === "true";
  const isAnonReservations = formData.get("rules.isAnonReservations") === "true";
  const isSecondHandOk = formData.get("rules.isSecondHandOk") === "true";
  const isHandmadeOk = formData.get("rules.isHandmadeOk") === "true";

  // Budget: string -> cents ou null
  const budgetCapRaw = String(formData.get("rules.budgetCap") || "")
    .replace(/\s/g, "")
    .replace(",", ".");
  let budgetCapCents: number | null = null;
  if (budgetCapRaw) {
    const n = Number.parseFloat(budgetCapRaw);
    budgetCapCents = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  const nextGiftMode = toPrismaGiftMode(giftMode);
  const normalized = {
    isNoSpoil,
    isAnonReservations,
    isSecondHandOk,
    isHandmadeOk,
    budgetCapCents,
  };

  await prisma.$transaction(async (tx) => {
    const currentEvent = await tx.event.findUnique({
      where: { id: eventId },
      select: { eventOn: true },
    });

    const event = await tx.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        eventOn,
        location,
        giftMode: nextGiftMode,
        ...(eventTime !== undefined ? { eventTime } : {}),
      },
      select: { id: true, giftMode: true },
    });

    const giftsModule = await tx.eventModule.upsert({
      where: { eventId_key: { eventId, key: "GIFTS" } },
      update: { enabled: true, position: MODULE_POSITIONS.GIFTS },
      create: {
        eventId,
        key: "GIFTS",
        enabled: true,
        position: MODULE_POSITIONS.GIFTS,
      },
    });

    await tx.eventGiftsSettings.upsert({
      where: { eventModuleId: giftsModule.id },
      update: {
        isNoSpoil: normalized.isNoSpoil,
        isAnonReservations: normalized.isAnonReservations,
        isSecondHandOk: normalized.isSecondHandOk,
        isHandmadeOk: normalized.isHandmadeOk,
        budgetCapCents: normalized.budgetCapCents,
      },
      create: {
        eventModuleId: giftsModule.id,
        isNoSpoil: normalized.isNoSpoil,
        isAnonReservations: normalized.isAnonReservations,
        isSecondHandOk: normalized.isSecondHandOk,
        isHandmadeOk: normalized.isHandmadeOk,
        budgetCapCents: normalized.budgetCapCents,
      },
    });

    if (giftsModule.enabled && event.giftMode === EventGiftMode.PERSONAL_LISTS) {
      await syncGiftListsForEvent(tx, event.id);
    }

    await shiftTimelineMomentsForEventDateChange(tx, eventId, currentEvent?.eventOn ?? null, eventOn);
  });

  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}

export async function updateBasicInfo(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Non authentifié");
  }

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const dateStr = formData.get("eventOn") as string;
  const eventTime = normalizeEventTime(formData.get("eventTime"));
  const location = (formData.get("location") as string) || null;

  if (!title?.trim()) {
    throw new Error("Le titre est requis");
  }

  const eventOn = dateStr ? new Date(dateStr + "T12:00:00.000Z") : null;

  await prisma.$transaction(async (tx) => {
    const currentEvent = await tx.event.findUnique({
      where: { id: eventId },
      select: { eventOn: true },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        title: title.trim(),
        description,
        eventOn,
        eventTime,
        location,
      },
    });

    await shiftTimelineMomentsForEventDateChange(tx, eventId, currentEvent?.eventOn ?? null, eventOn);
  });

  revalidatePath(`/event/${slug}`);
  revalidatePath(`/event/${slug}/edit`);
}

/**
 * Met à jour uniquement la description d'un événement
 * Action rapide pour édition inline (sans redirect)
 */
export async function updateEventDescription(
  eventId: string,
  slug: string,
  description: string | null,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  // Validation
  const trimmed = description?.trim() || null;
  if (trimmed && trimmed.length > 1000) {
    return { success: false, error: "Description trop longue (max 1000 caractères)" };
  }

  // Vérifier les permissions (OWNER ou ADMIN uniquement)
  const membership = await prisma.eventMember.findFirst({
    // ✅ eventMember (pas eventMembership)
    where: {
      eventId,
      userId: session.user.id,
      role: { in: [EventMemberRole.OWNER, EventMemberRole.ADMIN] },
    },
  });

  if (!membership) {
    return { success: false, error: "Permissions insuffisantes" };
  }

  // Mise à jour
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { description: trimmed },
    });

    revalidatePath(`/event/${slug}`);
    revalidatePath(`/event/${slug}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Error updating description:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}
