import { prisma } from "@/lib/prisma";

import type {
  ProgrammeLiveData,
  ProgrammeLiveMoment,
  ProgrammeSummary,
  ProgrammeStatus,
} from "../../types";

function formatLocalDateTimeValue(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getEndOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function getEventTimelineData(eventId: string): Promise<{
  moments: ProgrammeLiveMoment[];
  programmeLive: ProgrammeLiveData;
  programmeSummary: ProgrammeSummary;
}> {
  const rows = await prisma.eventTimelineMoment.findMany({
    where: { eventId },
    orderBy: [{ startsAt: "asc" }, { position: "asc" }],
    select: {
      id: true,
      title: true,
      kind: true,
      startsAt: true,
      endsAt: true,
      locationName: true,
      locationAddress: true,
      note: true,
      position: true,
    },
  });

  const toProgrammeMoment = (row: (typeof rows)[number]): ProgrammeLiveMoment => ({
    ...row,
    startsAt: formatLocalDateTimeValue(row.startsAt),
    endsAt: row.endsAt ? formatLocalDateTimeValue(row.endsAt) : null,
  });

  const getImplicitEnd = (index: number) => {
    const row = rows[index];
    if (!row) return null;

    if (row.endsAt) {
      return row.endsAt;
    }

    const nextSameDay = rows.find((candidate, candidateIndex) => {
      if (candidateIndex <= index) return false;
      return isSameCalendarDay(row.startsAt, candidate.startsAt);
    });

    if (nextSameDay) {
      return nextSameDay.startsAt;
    }

    return getEndOfDay(row.startsAt);
  };

  const moments = rows.map(toProgrammeMoment);
  const now = new Date();
  const current =
    rows.find((row, index) => {
      const effectiveEnd = getImplicitEnd(index);
      return effectiveEnd ? row.startsAt <= now && now < effectiveEnd : row.startsAt <= now;
    }) ?? null;
  const upcoming = rows.find((row) => row.startsAt > now) ?? null;

  const currentMoment = current ? toProgrammeMoment(current) : null;
  const nextMoment = upcoming ? toProgrammeMoment(upcoming) : null;
  const hasPastMoments = rows.some((row, index) => {
    const effectiveEnd = getImplicitEnd(index);
    return effectiveEnd ? effectiveEnd <= now : false;
  });
  const programmeStatus: ProgrammeStatus = current
    ? "current"
    : upcoming
      ? "upcoming"
      : rows.length > 0 && hasPastMoments
        ? "completed"
        : "empty";

  const target = current ?? upcoming;
  const programmeSummary: ProgrammeSummary = target
    ? {
        status: current ? "En cours" : "À venir",
        title: target.title,
        startsAt: formatLocalDateTimeValue(target.startsAt),
        endsAt: target.endsAt ? formatLocalDateTimeValue(target.endsAt) : null,
        locationName: target.locationName,
        note: target.note,
        next:
          current && nextMoment
            ? {
                title: nextMoment.title,
                startsAt: nextMoment.startsAt,
                endsAt: nextMoment.endsAt,
              }
            : null,
      }
    : null;

  return {
    moments,
    programmeLive: {
      currentMoment,
      nextMoment,
      hasPastMoments,
      programmeStatus,
    },
    programmeSummary,
  };
}
