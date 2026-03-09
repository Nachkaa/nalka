// src/domain/polls/getEventPollsVM.ts
import { prisma } from "@/lib/prisma";
import { EventPollType, EventPollStatus } from "@prisma/client";

export type EventPollVoterVM = {
  userId: string;
  name: string | null;
  email: string | null;
  isMe: boolean;
};

export type EventPollOptionVM = {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  voters: EventPollVoterVM[];
};

export type EventPollVM = {
  id: string;
  type: EventPollType;
  status: EventPollStatus;
  isActive: boolean;
  options: EventPollOptionVM[];
};

function labelFor(type: EventPollType, o: { dateValue: Date | null; textValue: string | null }) {
  if (type === EventPollType.SCHEDULE)
    return o.dateValue ? o.dateValue.toISOString().slice(0, 10) : "—";
  const t = o.textValue?.trim();
  return t ? t : "—";
}

export async function getEventPollsVM(eventId: string, meId: string): Promise<EventPollVM[]> {
  // Gate #1: rien à charger si aucun poll
  const pollCount = await prisma.eventPoll.count({ where: { eventId } });
  if (pollCount === 0) return [];

  // Polls + options
  const polls = await prisma.eventPoll.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { options: { orderBy: { sort: "asc" } } },
  });

  const optionIds = polls.flatMap((p) => p.options.map((o) => o.id));
  if (optionIds.length === 0) {
    return polls.map((p) => ({
      id: p.id,
      type: p.type,
      status: p.status,
      isActive: p.isActive,
      options: [],
    }));
  }

  // Counts par option
  const counts = await prisma.eventPollVote.groupBy({
    by: ["pollOptionId"],
    where: { pollOptionId: { in: optionIds } },
    _count: { _all: true },
  });
  const countByOptionId = new Map(counts.map((c) => [c.pollOptionId, c._count._all]));

  // Mes votes (multi-choix)
  const myVotes = await prisma.eventPollVote.findMany({
    where: { byUserId: meId, pollOptionId: { in: optionIds } },
    select: { pollOptionId: true },
  });
  const myOptionIds = new Set(myVotes.map((v) => v.pollOptionId));

  // Votants par option (qui a voté quoi)
  const allVotes = await prisma.eventPollVote.findMany({
    where: { pollOptionId: { in: optionIds } },
    select: {
      pollOptionId: true,
      byUserId: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" }, // stable
  });

  const votersByOptionId = new Map<string, EventPollVoterVM[]>();
  for (const v of allVotes) {
    const arr = votersByOptionId.get(v.pollOptionId) ?? [];
    arr.push({
      userId: v.byUserId,
      name: v.user?.name ?? null,
      email: v.user?.email ?? null,
      isMe: v.byUserId === meId,
    });
    votersByOptionId.set(v.pollOptionId, arr);
  }

  // VM + tri options par votes desc (tie-break: checked, puis sort)
  return polls.map((p) => {
    const optionsSorted = [...p.options].sort((a, b) => {
      const ca = countByOptionId.get(a.id) ?? 0;
      const cb = countByOptionId.get(b.id) ?? 0;
      if (cb !== ca) return cb - ca;

      const ma = myOptionIds.has(a.id);
      const mb = myOptionIds.has(b.id);
      if (ma !== mb) return mb ? 1 : -1; // mes choix en haut en cas d'égalité

      return a.sort - b.sort;
    });

    return {
      id: p.id,
      type: p.type,
      status: p.status,
      isActive: p.isActive,
      options: optionsSorted.map((o) => {
        const votersRaw = votersByOptionId.get(o.id) ?? [];

        // Optionnel: mettre "moi" en dernier/ premier chez les votants
        const voters = [...votersRaw].sort((x, y) => Number(y.isMe) - Number(x.isMe));

        return {
          id: o.id,
          label: labelFor(p.type, o),
          count: countByOptionId.get(o.id) ?? 0,
          checked: myOptionIds.has(o.id),
          voters,
        };
      }),
    };
  });
}
