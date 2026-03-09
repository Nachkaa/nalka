import { EventPollClosedReason, EventPollStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PollRow = {
  id: string;
  eventId: string;
  type: string;
  status: EventPollStatus;
  createdAt: Date;
};

function groupKey(eventId: string, type: string) {
  return `${eventId}:${type}`;
}

async function main() {
  const polls = (await prisma.eventPoll.findMany({
    select: {
      id: true,
      eventId: true,
      type: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ eventId: "asc" }, { type: "asc" }, { createdAt: "desc" }],
  })) as PollRow[];

  const groups = new Map<string, PollRow[]>();
  for (const poll of polls) {
    const key = groupKey(poll.eventId, poll.type);
    const arr = groups.get(key) ?? [];
    arr.push(poll);
    groups.set(key, arr);
  }

  for (const [, group] of groups) {
    const newestOpen = group.find((poll) => poll.status === EventPollStatus.OPEN) ?? null;
    const newestOverall = group[0] ?? null;
    const activePollId = newestOpen?.id ?? newestOverall?.id ?? null;
    if (!activePollId) continue;

    await prisma.$transaction(async (tx) => {
      for (const poll of group) {
        if (poll.id === activePollId) {
          await tx.eventPoll.update({
            where: { id: poll.id },
            data: { isActive: true },
          });
          continue;
        }

        const shouldCloseAsReplaced = poll.status === EventPollStatus.OPEN;

        await tx.eventPoll.update({
          where: { id: poll.id },
          data: {
            isActive: false,
            ...(shouldCloseAsReplaced
              ? {
                  status: EventPollStatus.CLOSED,
                  closedReason: EventPollClosedReason.REPLACED,
                  closedAt: new Date(),
                }
              : {}),
          },
        });
      }
    });
  }

  console.log(`Backfill done for ${groups.size} poll groups.`);
}

main()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
