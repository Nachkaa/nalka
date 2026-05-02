import { prisma } from "@/lib/prisma";
import { EventPollType } from "@prisma/client";

import type { EventPollVM } from "../../types";

function labelFor(type: EventPollType, option: { dateValue: Date | null; textValue: string | null }) {
  if (type === EventPollType.SCHEDULE) {
    return option.dateValue ? option.dateValue.toISOString().slice(0, 10) : "—";
  }

  const text = option.textValue?.trim();
  return text ? text : "—";
}

export async function getEventPollsVM(eventId: string, meId: string): Promise<EventPollVM[]> {
  const pollCount = await prisma.eventPoll.count({ where: { eventId } });
  if (pollCount === 0) return [];

  const polls = await prisma.eventPoll.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { options: { orderBy: { sort: "asc" } } },
  });

  const optionIds = polls.flatMap((poll) => poll.options.map((option) => option.id));
  if (optionIds.length === 0) {
    return polls.map((poll) => ({
      id: poll.id,
      type: poll.type,
      status: poll.status,
      isActive: poll.isActive,
      options: [],
    }));
  }

  const counts = await prisma.eventPollVote.groupBy({
    by: ["pollOptionId"],
    where: { pollOptionId: { in: optionIds } },
    _count: { _all: true },
  });
  const countByOptionId = new Map(counts.map((count) => [count.pollOptionId, count._count._all]));

  const myVotes = await prisma.eventPollVote.findMany({
    where: { byUserId: meId, pollOptionId: { in: optionIds } },
    select: { pollOptionId: true },
  });
  const myOptionIds = new Set(myVotes.map((vote) => vote.pollOptionId));

  const allVotes = await prisma.eventPollVote.findMany({
    where: { pollOptionId: { in: optionIds } },
    select: {
      pollOptionId: true,
      byUserId: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const votersByOptionId = new Map<string, EventPollVM["options"][number]["voters"]>();
  for (const vote of allVotes) {
    const voters = votersByOptionId.get(vote.pollOptionId) ?? [];
    voters.push({
      userId: vote.byUserId,
      name: vote.user?.name ?? null,
      email: vote.user?.email ?? null,
      isMe: vote.byUserId === meId,
    });
    votersByOptionId.set(vote.pollOptionId, voters);
  }

  return polls.map((poll) => {
    const optionsSorted = [...poll.options].sort((left, right) => {
      const leftCount = countByOptionId.get(left.id) ?? 0;
      const rightCount = countByOptionId.get(right.id) ?? 0;
      if (rightCount !== leftCount) return rightCount - leftCount;

      const leftMine = myOptionIds.has(left.id);
      const rightMine = myOptionIds.has(right.id);
      if (leftMine !== rightMine) return rightMine ? 1 : -1;

      return left.sort - right.sort;
    });

    return {
      id: poll.id,
      type: poll.type,
      status: poll.status,
      isActive: poll.isActive,
      options: optionsSorted.map((option) => {
        const votersRaw = votersByOptionId.get(option.id) ?? [];
        const voters = [...votersRaw].sort((left, right) => Number(right.isMe) - Number(left.isMe));

        return {
          id: option.id,
          label: labelFor(poll.type, option),
          count: countByOptionId.get(option.id) ?? 0,
          checked: myOptionIds.has(option.id),
          voters,
        };
      }),
    };
  });
}
