// src/app/(app)/event/[slug]/actions/polls.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  EventLocationMode,
  EventMemberRole,
  EventModuleKey,
  EventPollStatus,
  EventPollType,
  EventScheduleMode,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireEventAdmin(eventId: string, userId: string) {
  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });

  if (
    !membership ||
    (membership.role !== EventMemberRole.OWNER && membership.role !== EventMemberRole.ADMIN)
  ) {
    throw new Error("Non autorisé");
  }
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, eventOn: true, location: true },
  });
  if (!event) throw new Error("Event introuvable");

  await requireEventAdmin(event.id, userId);

  const status = open ? EventPollStatus.OPEN : EventPollStatus.CLOSED;
  const openPoll = await prisma.eventPoll.findFirst({
    where: {
      eventId: event.id,
      type,
      status: EventPollStatus.OPEN,
    },
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
      where: {
        eventId: event.id,
        type,
        isActive: true,
      },
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
        data: {
          eventId: event.id,
          type,
          status,
          isActive: true,
        },
      });
    }

    const modeUpdate =
      type === EventPollType.LOCATION
        ? { locationMode: EventLocationMode.POLL }
        : { scheduleMode: EventScheduleMode.POLL };

    await tx.event.update({
      where: { slug },
      data: modeUpdate,
    });

    await tx.eventModule.updateMany({
      where: { eventId: event.id, key: EventModuleKey.POLLS },
      data: { enabled: true },
    });
  });

  revalidatePath(`/event/${slug}`);
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const poll = await prisma.eventPoll.findUnique({
    where: { id: pollId },
    select: { id: true, eventId: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventAdmin(poll.eventId, userId);

  await prisma.eventPoll.update({
    where: { id: poll.id },
    data: { status: EventPollStatus.CLOSED },
  });

  revalidatePath(`/event/${slug}`);
}

export async function closePoll(params: { slug: string; pollId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventAdmin(poll.eventId, userId);

  await prisma.eventPoll.update({
    where: { id: poll.id },
    data: { status: EventPollStatus.CLOSED },
  });

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}

export async function reopenPoll(params: { slug: string; pollId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true, type: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventAdmin(poll.eventId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.eventPoll.update({
      where: { id: poll.id },
      data: { status: EventPollStatus.OPEN },
    });

    const modeUpdate =
      poll.type === EventPollType.LOCATION
        ? { locationMode: EventLocationMode.POLL }
        : { scheduleMode: EventScheduleMode.POLL };

    await tx.event.update({ where: { id: poll.eventId }, data: modeUpdate });
  });

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}

export async function addPollOption(params: {
  slug: string;
  pollId: string;
  textValue?: string;
  dateValue?: string; // "YYYY-MM-DD"
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true, type: true, status: true },
  });
  if (!poll) throw new Error("Sondage introuvable");
  if (poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");
  await requireEventAdmin(poll.eventId, userId);

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
    const raw = (params.dateValue ?? "").trim(); // YYYY-MM-DD
    if (!raw) throw new Error("Date vide");

    const d = new Date(`${raw}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new Error("Date invalide");

    await prisma.eventPollOption.create({
      data: { pollId: poll.id, sort: nextSort, dateValue: d },
    });
  }

  revalidatePath(`/event/${params.slug}`);
}

export async function togglePollVote(params: { slug: string; pollOptionId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const opt = await prisma.eventPollOption.findUnique({
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
  if (!opt?.poll) throw new Error("Option introuvable");
  if (opt.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId: opt.poll.eventId } },
    select: { id: true },
  });
  if (!membership) throw new Error("Non autorisé");

  const existing = await prisma.eventPollVote.findUnique({
    where: {
      pollOptionId_byUserId: {
        pollOptionId: opt.id,
        byUserId: userId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.eventPollVote.delete({
      where: {
        pollOptionId_byUserId: {
          pollOptionId: opt.id,
          byUserId: userId,
        },
      },
    });
  } else {
    await prisma.eventPollVote.create({
      data: {
        pollId: opt.pollId,
        pollOptionId: opt.id,
        byUserId: userId,
      },
    });
  }

  revalidatePath(`/event/${params.slug}`);
  return { voted: !existing };
}

export async function applyPollOptionToEvent(params: {
  slug: string;
  pollOptionId: string;
  closePoll?: boolean;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const opt = await prisma.eventPollOption.findUnique({
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

  if (!opt?.poll) throw new Error("Option introuvable");
  if (opt.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventAdmin(opt.poll.eventId, userId);

  let eventUpdate: Prisma.EventUpdateInput = {};

  switch (opt.poll.type) {
    case EventPollType.LOCATION: {
      const text = (opt.textValue ?? "").trim();
      if (!text) throw new Error("Option lieu invalide");
      eventUpdate = { location: text, locationMode: EventLocationMode.EXACT };
      break;
    }
    case EventPollType.SCHEDULE: {
      if (!opt.dateValue) throw new Error("Option date invalide");
      eventUpdate = { eventOn: opt.dateValue, scheduleMode: EventScheduleMode.EXACT };
      break;
    }
    default:
      throw new Error("Type de sondage non supporté pour une décision");
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: opt.poll!.eventId }, data: eventUpdate });

    if (params.closePoll) {
      await tx.eventPoll.update({
        where: { id: opt.poll!.id },
        data: { status: EventPollStatus.CLOSED },
      });
    }
  });

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}

export async function renamePollOption(params: {
  slug: string;
  pollOptionId: string;
  label: string; // LOCATION: text, SCHEDULE: "YYYY-MM-DD"
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const label = (params.label ?? "").trim();
  if (!label) throw new Error("Option vide");

  const opt = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      pollId: true,
      poll: {
        select: { id: true, eventId: true, status: true, type: true },
      },
    },
  });

  if (!opt?.poll) throw new Error("Option introuvable");
  if (opt.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventAdmin(opt.poll.eventId, userId);

  if (opt.poll.type === EventPollType.LOCATION) {
    await prisma.eventPollOption.update({ where: { id: opt.id }, data: { textValue: label } });
  } else if (opt.poll.type === EventPollType.SCHEDULE) {
    const d = new Date(`${label}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new Error("Date invalide");
    await prisma.eventPollOption.update({ where: { id: opt.id }, data: { dateValue: d } });
  } else {
    throw new Error("Type de sondage non supporté");
  }

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}

export async function deletePollOption(params: { slug: string; pollOptionId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const opt = await prisma.eventPollOption.findUnique({
    where: { id: params.pollOptionId },
    select: {
      id: true,
      pollId: true,
      poll: {
        select: { id: true, eventId: true, status: true },
      },
    },
  });

  if (!opt?.poll) throw new Error("Option introuvable");
  if (opt.poll.status !== EventPollStatus.OPEN) throw new Error("Sondage fermé");

  await requireEventAdmin(opt.poll.eventId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.eventPollVote.deleteMany({ where: { pollOptionId: opt.id } });
    await tx.eventPollOption.delete({ where: { id: opt.id } });
  });

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}

export async function deletePoll(params: { slug: string; pollId: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non autorisé");

  const poll = await prisma.eventPoll.findUnique({
    where: { id: params.pollId },
    select: { id: true, eventId: true },
  });
  if (!poll) throw new Error("Sondage introuvable");

  await requireEventAdmin(poll.eventId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.eventPollVote.deleteMany({ where: { pollId: poll.id } });
    await tx.eventPollOption.deleteMany({ where: { pollId: poll.id } });
    await tx.eventPoll.delete({ where: { id: poll.id } });
  });

  revalidatePath(`/event/${params.slug}`);
  return { ok: true };
}
