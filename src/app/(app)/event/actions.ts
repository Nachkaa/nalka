"use server";

import { auth } from "@/auth";
import { EventCreateSchema } from "@/domain/events";
import { buildEventModuleSeeds } from "@/features/events/module-registry";
import { syncGiftListsIfEnabled } from "@/features/gifts/server/lifecycle";
import { prisma } from "@/lib/prisma";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";
import {
  EventGiftMode,
  EventLocationMode,
  EventModuleKey,
  EventPollType,
  EventScheduleMode,
  EventStatus,
} from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

async function requireUserId() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.id) {
    const byId = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  if (!session.user.email) throw new Error("Missing email");

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined },
    create: { email: session.user.email, name: session.user.name ?? null },
    select: { id: true },
  });

  return user.id;
}

function coerceEnum<T extends string>(
  v: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof v !== "string") return fallback;
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export async function createEvent(formData: FormData) {
  const ownerId = await requireUserId();

  const ip = await getClientIp();
  await limit({ key: `event:create:ip:${ip}`, max: 20, windowMs: 60 * 60_000 });
  await limit({ key: `event:create:user:${ownerId}`, max: 10, windowMs: 24 * 60 * 60_000 });

  // Ensure discriminators always exist in correct format (caps).
  // This matches the "Prisma enums end-to-end" approach.
  const scheduleMode = coerceEnum(
    formData.get("schedule.mode"),
    [EventScheduleMode.EXACT, EventScheduleMode.POLL, EventScheduleMode.TBD] as const,
    EventScheduleMode.TBD,
  );

  const locationMode = coerceEnum(
    formData.get("location.mode"),
    [EventLocationMode.EXACT, EventLocationMode.POLL, EventLocationMode.TBD] as const,
    EventLocationMode.TBD,
  );

  const giftMode = coerceEnum(
    formData.get("giftMode") ?? formData.get("gifts.mode") ?? formData.get("modules.giftMode"),
    [EventGiftMode.HOST_LIST, EventGiftMode.PERSONAL_LISTS] as const,
    EventGiftMode.HOST_LIST,
  );

  const parsed = EventCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),

    location: {
      mode: locationMode,
      value: formData.get("location.value"),
      options: formData.getAll("location.options"),
    },

    schedule: {
      mode: scheduleMode,
      date: formData.get("schedule.date"),
      options: formData.getAll("schedule.options"),
      time: formData.get("schedule.time"),
    },

    giftMode,
    giftsEnabled: formData.get("modules.giftsEnabled"),

    secretSantaEnabled: formData.get("modules.secretSantaEnabled"),
    isNoSpoil: formData.get("rules.isNoSpoil"),
    isAnonReservations: formData.get("rules.isAnonReservations"),
    isSecondHandOk: formData.get("rules.isSecondHandOk"),
    isHandmadeOk: formData.get("rules.isHandmadeOk"),
    budgetCap: formData.get("rules.budgetCap"),

    bringEnabled: formData.get("modules.bringEnabled"),
    timelineEnabled: formData.get("modules.timelineEnabled"),
  });

  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error("Invalid input");
  }

  const data = parsed.data;

  const base = slugify(data.title) || nanoid(6);
  const slug = `${base}-${nanoid(6)}`;

  const eventOn = data.schedule.mode === EventScheduleMode.EXACT ? data.schedule.date : null;
  const location = data.location.mode === EventLocationMode.EXACT ? data.location.value : null;

  const scheduleOptions =
    data.schedule.mode === EventScheduleMode.POLL ? data.schedule.options : [];
  const locationOptions =
    data.location.mode === EventLocationMode.POLL ? data.location.options : [];

  const status: EventStatus =
    data.schedule.mode === EventScheduleMode.EXACT ? EventStatus.ACTIVE : EventStatus.PLANNING;

  const e = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        slug,
        title: data.title.trim(),
        description: data.description,

        ownerId,
        status,
        eventOn,
        eventTime: data.schedule.time,
        location,

        scheduleMode: data.schedule.mode,
        locationMode: data.location.mode,

        giftMode: data.giftMode,
      },
      select: { id: true, slug: true },
    });

    await tx.eventMember.upsert({
      where: { userId_eventId: { userId: ownerId, eventId: event.id } },
      update: { role: "OWNER", rsvpStatus: "GOING", rsvpRespondedAt: new Date() },
      create: {
        eventId: event.id,
        userId: ownerId,
        role: "OWNER",
        rsvpStatus: "GOING",
        rsvpRespondedAt: new Date(),
      },
    });

    const modulesToCreate = buildEventModuleSeeds({
      [EventModuleKey.GIFTS]: !!data.giftsEnabled,
      [EventModuleKey.SECRET_SANTA]: !!data.secretSantaEnabled,
      [EventModuleKey.POTLUCK]: !!data.bringEnabled,
      [EventModuleKey.TIMELINE]: !!data.timelineEnabled,
      [EventModuleKey.POLLS]:
        data.schedule.mode === EventScheduleMode.POLL ||
        data.location.mode === EventLocationMode.POLL,
    });

    const createdModules = await Promise.all(
      modulesToCreate.map((mod) =>
        tx.eventModule.create({
          data: {
            eventId: event.id,
            key: mod.key,
            enabled: mod.enabled,
            position: mod.position,
          },
          select: { id: true, key: true, enabled: true },
        }),
      ),
    );

    const moduleByKey = new Map(createdModules.map((m) => [m.key, m]));
    const isEnabled = (key: EventModuleKey) => moduleByKey.get(key)?.enabled === true;
    const idOf = (key: EventModuleKey) => moduleByKey.get(key)!.id;

    type SettingsJob = { key: EventModuleKey; run: () => Promise<unknown> };

    const settingsJobs: SettingsJob[] = [
      {
        key: EventModuleKey.OVERVIEW,
        run: () =>
          tx.eventOverviewSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.OVERVIEW), rsvpRequired: true },
          }),
      },
      {
        key: EventModuleKey.GIFTS,
        run: () =>
          tx.eventGiftsSettings.create({
            data: {
              eventModuleId: idOf(EventModuleKey.GIFTS),
              isNoSpoil: data.isNoSpoil,
              isAnonReservations: data.isAnonReservations,
              isSecondHandOk: data.isSecondHandOk,
              isHandmadeOk: data.isHandmadeOk,
              budgetCapCents: data.budgetCap,
            },
          }),
      },
      {
        key: EventModuleKey.SECRET_SANTA,
        run: () =>
          tx.eventSecretSantaSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.SECRET_SANTA) },
          }),
      },
      {
        key: EventModuleKey.POTLUCK,
        run: () =>
          tx.eventPotluckSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.POTLUCK) },
          }),
      },
      {
        key: EventModuleKey.TIMELINE,
        run: () =>
          tx.eventTimelineSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.TIMELINE) },
          }),
      },
      {
        key: EventModuleKey.EXPENSES,
        run: () =>
          tx.eventExpensesSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.EXPENSES) },
          }),
      },
      {
        key: EventModuleKey.POLLS,
        run: () =>
          tx.eventPollsSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.POLLS) },
          }),
      },
      {
        key: EventModuleKey.CHAT,
        run: () =>
          tx.eventChatSettings.create({
            data: { eventModuleId: idOf(EventModuleKey.CHAT) },
          }),
      },
    ];

    await Promise.all(settingsJobs.filter((j) => isEnabled(j.key)).map((j) => j.run()));

    if (isEnabled(EventModuleKey.GIFTS)) {
      await syncGiftListsIfEnabled(tx, event.id);
    }

    if (data.schedule.mode === EventScheduleMode.POLL) {
      const poll = await tx.eventPoll.create({
        data: { eventId: event.id, type: EventPollType.SCHEDULE },
        select: { id: true },
      });

      const dates = scheduleOptions.map((s) => String(s).trim()).filter(Boolean);

      if (dates.length > 0) {
        await tx.eventPollOption.createMany({
          data: dates.map((iso, i) => ({
            pollId: poll.id,
            sort: i,
            dateValue: new Date(`${iso}T00:00:00.000Z`),
          })),
        });
      }
    }

    if (data.location.mode === EventLocationMode.POLL) {
      const poll = await tx.eventPoll.create({
        data: { eventId: event.id, type: EventPollType.LOCATION },
        select: { id: true },
      });

      const opts = locationOptions.map((s) => String(s).trim()).filter(Boolean);

      if (opts.length > 0) {
        await tx.eventPollOption.createMany({
          data: opts.map((text, i) => ({
            pollId: poll.id,
            sort: i,
            textValue: text,
          })),
        });
      }
    }

    return event;
  });

  revalidatePath("/event");
  redirect(`/event/${e.slug}`);
}
