"use server";

import { requireEventMembership, requireEventOrganizer } from "@/features/events/access";
import { getEventModulePosition } from "@/features/events/module-registry";
import { prisma } from "@/lib/prisma";
import {
  EventLocationMode,
  EventModuleKey,
  EventPollStatus,
  EventPollType,
  EventScheduleMode,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

function revalidateEventPollPaths(slug: string) {
  revalidatePath(`/event/${slug}`);
}

export async function ensurePollBySlug({
  slug,
  type,
  open = true,
  allowReopen = false,
}: {
  slug: string;
  type: EventPollType;
  open?: boolean;
  allowReopen?: boolean;
}) {
  const access = await requireEventOrganizer({ slug });

  const event = await prisma.event.findUnique({
    where: { id: access.event.id },
    select: { id: true, slug: true, eventOn: true, location: true },
  });
  if (!event) throw new Error("Event introuvable");

  const status = open ? EventPollStatus.OPEN : EventPollStatus.CLOSED;
  const openPoll = await prisma.eventPoll.findFirst({
    where: { eventId: event.id, type, status: EventPollStatus.OPEN },
    select: { id: true },
  });

  if (openPoll) {
    return { ok: true, pollId: openPoll.id, reusedOpenPoll: true };
  }

  const hasFinalValue =
    type === EventPollType.SCHEDULE ? Boolean(event.eventOn) : Boolean(event.location?.trim());

  if (hasFinalValue && !allowReopen) {
    throw new Error("POLL_REOPEN_NOT_ALLOWED");
  }

  await prisma.$transaction(async (tx) => {
    const existingPoll = await tx.eventPoll.findFirst({
      where: { eventId: event.id, type, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existingPoll) {
      await tx.eventPoll.update({
        where: { id: existingPoll.id },
        data: { status },
      });
    } else {
      await tx.eventPoll.create({
        data: { eventId: event.id, type, status, isActive: true },
      });
    }

    const modeUpdate =
      type === EventPollType.LOCATION
        ? { locationMode: EventLocationMode.POLL }
        : { scheduleMode: EventScheduleMode.POLL };

    await tx.event.update({
      where: { id: event.id },
      data: modeUpdate,
    });

    await tx.eventModule.upsert({
      where: { eventId_key: { eventId: event.id, key: EventModuleKey.POLLS } },
      update: { enabled: true, position: getEventModulePosition(EventModuleKey.POLLS) },
      create: {
        eventId: event.id,
        key: EventModuleKey.POLLS,
        enabled: true,
        position: getEventModulePosition(EventModuleKey.POLLS),
      },
    });
  });

  revalidateEventPollPaths(slug);
  return { ok: true };
}

export async function ensureSchedulePoll(
  slug: string,
  options?: { allowReopen?: boolean; open?: boolean },
) {
  return ensurePollBySlug({
    slug,
    type: EventPollType.SCHEDULE,
    allowReopen: options?.allowReopen ?? false,
    open: options?.open ?? true,
  });
}

export async function ensureLocationPoll(
  slug: string,
  options?: { allowReopen?: boolean; open?: boolean },
) {
  return ensurePollBySlug({
    slug,
    type: EventPollType.LOCATION,
    allowReopen: options?.allowReopen ?? false,
    open: options?.open ?? true,
  });
}

export async function closePollById(pollId: string, slug: string) {
  const poll = await prisma.eventPoll.findUnique({
    where: { id: pollId },
    select: { id: true, eventId: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventOrganizer({ eventId: poll.eventId });

  await prisma.eventPoll.update({
    where: { id: poll.id },
    data: { status: EventPollStatus.CLOSED },
  });

  revalidateEventPollPaths(slug);
}

export async function closePoll(params: { slug: string; pollId: string }) {
  await closePollById(params.pollId, params.slug);
  return { ok: true };
}

export async function reopenPoll(params: { slug: string; pollId: string }) {
  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true, type: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventOrganizer({ eventId: poll.eventId });

  await prisma.$transaction(async (tx) => {
    await tx.eventPoll.update({
      where: { id: poll.id },
      data: { status: EventPollStatus.OPEN },
    });

    const modeUpdate =
      poll.type === EventPollType.LOCATION
        ? { locationMode: EventLocationMode.POLL }
        : { scheduleMode: EventScheduleMode.POLL };

    await tx.event.update({
      where: { id: poll.eventId },
      data: modeUpdate,
    });
  });

  revalidateEventPollPaths(params.slug);
  return { ok: true };
}

export async function addPollOption(params: {
  slug: string;
  pollId: string;
  textValue?: string;
  dateValue?: string;
}) {
  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true, type: true, status: true },
  });
  if (!poll) throw new Error("Sondage introuvable");
  if (poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventOrganizer({ eventId: poll.eventId });

  const last = await prisma.eventPollOption.findFirst({
    where: { pollId: poll.id },
    orderBy: { sort: "desc" },
    select: { sort: true },
  });
  const nextSort = (last?.sort ?? -1) + 1;

  if (poll.type === EventPollType.LOCATION) {
    const text = (params.textValue ?? "").trim();
    if (!text) throw new Error("Option vide");

    await prisma.eventPollOption.create({
      data: { pollId: poll.id, sort: nextSort, textValue: text },
    });
  } else {
    const raw = (params.dateValue ?? "").trim();
    if (!raw) throw new Error("Date vide");

    const date = new Date(`${raw}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Date invalide");

    await prisma.eventPollOption.create({
      data: { pollId: poll.id, sort: nextSort, dateValue: date },
    });
  }

  revalidateEventPollPaths(params.slug);
}

export async function togglePollVote(params: { slug: string; pollOptionId: string }) {
  const option = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      pollId: true,
      poll: {
        select: {
          id: true,
          status: true,
          eventId: true,
        },
      },
    },
  });
  if (!option?.poll) throw new Error("Option introuvable");
  if (option.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  const access = await requireEventMembership({ eventId: option.poll.eventId });

  const existing = await prisma.eventPollVote.findUnique({
    where: {
      pollOptionId_byUserId: {
        pollOptionId: option.id,
        byUserId: access.userId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.eventPollVote.delete({
      where: {
        pollOptionId_byUserId: {
          pollOptionId: option.id,
          byUserId: access.userId,
        },
      },
    });
  } else {
    await prisma.eventPollVote.create({
      data: {
        pollId: option.pollId,
        pollOptionId: option.id,
        byUserId: access.userId,
      },
    });
  }

  revalidateEventPollPaths(params.slug);
  return { voted: !existing };
}

export async function applyPollOptionToEvent(params: {
  slug: string;
  pollOptionId: string;
  closePoll?: boolean;
}) {
  const option = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      textValue: true,
      dateValue: true,
      poll: {
        select: {
          id: true,
          type: true,
          status: true,
          eventId: true,
        },
      },
    },
  });

  if (!option?.poll) throw new Error("Option introuvable");
  if (option.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventOrganizer({ eventId: option.poll.eventId });

  let eventUpdate: Prisma.EventUpdateInput = {};

  switch (option.poll.type) {
    case EventPollType.LOCATION: {
      const text = (option.textValue ?? "").trim();
      if (!text) throw new Error("Option lieu invalide");
      eventUpdate = { location: text, locationMode: EventLocationMode.EXACT };
      break;
    }
    case EventPollType.SCHEDULE: {
      if (!option.dateValue) throw new Error("Option date invalide");
      eventUpdate = { eventOn: option.dateValue, scheduleMode: EventScheduleMode.EXACT };
      break;
    }
    default:
      throw new Error("Type de sondage non supporté pour une décision");
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: option.poll!.eventId }, data: eventUpdate });

    if (params.closePoll) {
      await tx.eventPoll.update({
        where: { id: option.poll!.id },
        data: { status: EventPollStatus.CLOSED },
      });
    }
  });

  revalidateEventPollPaths(params.slug);
  return { ok: true };
}

export async function renamePollOption(params: {
  slug: string;
  pollOptionId: string;
  label: string;
}) {
  const label = (params.label ?? "").trim();
  if (!label) throw new Error("Option vide");

  const option = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      poll: {
        select: { id: true, eventId: true, status: true, type: true },
      },
    },
  });

  if (!option?.poll) throw new Error("Option introuvable");
  if (option.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventOrganizer({ eventId: option.poll.eventId });

  if (option.poll.type === EventPollType.LOCATION) {
    await prisma.eventPollOption.update({
      where: { id: option.id },
      data: { textValue: label },
    });
  } else if (option.poll.type === EventPollType.SCHEDULE) {
    const date = new Date(`${label}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Date invalide");
    await prisma.eventPollOption.update({
      where: { id: option.id },
      data: { dateValue: date },
    });
  } else {
    throw new Error("Type de sondage non supporté");
  }

  revalidateEventPollPaths(params.slug);
  return { ok: true };
}

export async function deletePollOption(params: { slug: string; pollOptionId: string }) {
  const option = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      poll: {
        select: { id: true, eventId: true, status: true },
      },
    },
  });

  if (!option?.poll) throw new Error("Option introuvable");
  if (option.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventOrganizer({ eventId: option.poll.eventId });

  await prisma.$transaction(async (tx) => {
    await tx.eventPollVote.deleteMany({ where: { pollOptionId: option.id } });
    await tx.eventPollOption.delete({ where: { id: option.id } });
  });

  revalidateEventPollPaths(params.slug);
  return { ok: true };
}

export async function deletePoll(params: { slug: string; pollId: string }) {
  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventOrganizer({ eventId: poll.eventId });

  await prisma.$transaction(async (tx) => {
    await tx.eventPollVote.deleteMany({ where: { pollId: poll.id } });
    await tx.eventPollOption.deleteMany({ where: { pollId: poll.id } });
    await tx.eventPoll.delete({ where: { id: poll.id } });
  });

  revalidateEventPollPaths(params.slug);
  return { ok: true };
}
