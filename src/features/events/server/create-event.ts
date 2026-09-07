import { EventCreateSchema } from "@/domain/events";
import { ensureBudgetForEvent } from "@/features/budget/server/ensure-budget-exists";
import { buildEventModuleSeeds } from "@/features/events/module-registry";
import { syncGiftListsIfEnabled } from "@/features/gifts/server/lifecycle";
import { prisma } from "@/lib/prisma";
import {
  EventGiftMode,
  EventLocationMode,
  EventModuleKey,
  EventPollType,
  EventScheduleMode,
  EventStatus,
  type Prisma,
} from "@prisma/client";
import { nanoid } from "nanoid";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function coerceEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value !== "string") return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseEventCreateFormData(formData: FormData) {
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
    budgetEnabled: formData.get("modules.budgetEnabled"),
  });

  if (!parsed.success) {
    throw new Error("Invalid event input");
  }

  return parsed.data;
}

export type EventCreateData = ReturnType<typeof parseEventCreateFormData>;

export async function createEventForOwner(
  tx: Prisma.TransactionClient,
  ownerId: string,
  data: EventCreateData,
) {
  const base = slugify(data.title) || nanoid(6);
  const slug = `${base}-${nanoid(6)}`;
  const eventOn = data.schedule.mode === EventScheduleMode.EXACT ? data.schedule.date : null;
  const location = data.location.mode === EventLocationMode.EXACT ? data.location.value : null;
  const scheduleOptions = data.schedule.mode === EventScheduleMode.POLL ? data.schedule.options : [];
  const locationOptions = data.location.mode === EventLocationMode.POLL ? data.location.options : [];
  const status: EventStatus =
    data.schedule.mode === EventScheduleMode.EXACT ? EventStatus.ACTIVE : EventStatus.PLANNING;

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
    [EventModuleKey.BUDGET]: !!data.budgetEnabled,
    [EventModuleKey.POLLS]:
      data.schedule.mode === EventScheduleMode.POLL || data.location.mode === EventLocationMode.POLL,
  });

  const createdModules = await Promise.all(
    modulesToCreate.map((eventModule) =>
      tx.eventModule.create({
        data: {
          eventId: event.id,
          key: eventModule.key,
          enabled: eventModule.enabled,
          position: eventModule.position,
        },
        select: { id: true, key: true, enabled: true },
      }),
    ),
  );

  const moduleByKey = new Map(createdModules.map((eventModule) => [eventModule.key, eventModule]));
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
      key: EventModuleKey.BUDGET,
      run: async () => {
        await tx.eventExpensesSettings.create({
          data: { eventModuleId: idOf(EventModuleKey.BUDGET) },
        });
        await ensureBudgetForEvent(tx, event.id);
      },
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

  await Promise.all(settingsJobs.filter((job) => isEnabled(job.key)).map((job) => job.run()));

  if (isEnabled(EventModuleKey.GIFTS)) {
    await syncGiftListsIfEnabled(tx, event.id);
  }

  if (data.schedule.mode === EventScheduleMode.POLL) {
    const poll = await tx.eventPoll.create({
      data: { eventId: event.id, type: EventPollType.SCHEDULE },
      select: { id: true },
    });
    const dates = scheduleOptions.map((value) => String(value).trim()).filter(Boolean);
    if (dates.length > 0) {
      await tx.eventPollOption.createMany({
        data: dates.map((iso, index) => ({
          pollId: poll.id,
          sort: index,
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
    const options = locationOptions.map((value) => String(value).trim()).filter(Boolean);
    if (options.length > 0) {
      await tx.eventPollOption.createMany({
        data: options.map((text, index) => ({
          pollId: poll.id,
          sort: index,
          textValue: text,
        })),
      });
    }
  }

  return event;
}

export async function createEventFromFormData(ownerId: string, formData: FormData) {
  const data = parseEventCreateFormData(formData);
  return prisma.$transaction((tx) => createEventForOwner(tx, ownerId, data));
}
