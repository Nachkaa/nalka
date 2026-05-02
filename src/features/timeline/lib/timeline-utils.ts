import { cn } from "@/lib/utils";
import { EventTimelineMomentKind } from "@prisma/client";

import type {
  EditorState,
  LiveTimelineMoment,
  MomentExecutionState,
  MomentSuggestion,
  TimelineDayGroup,
  TimelineMoment,
  TimelineSummary,
} from "../types";

export const QUARTER_HOUR_TIMES = Array.from({ length: 24 * 4 }, (_, index) => {
  const hours = String(Math.floor(index / 4)).padStart(2, "0");
  const minutes = String((index % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizeMomentTitle(value: string) {
  return normalizeText(value);
}

export function executionBadgeClass(state: "current" | "next" | "follow") {
  if (state === "current") {
    return "inline-flex items-center rounded-full bg-(--primary-700) px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-2 ring-(--primary-200)";
  }

  if (state === "next") {
    return "inline-flex items-center rounded-full border border-(--primary-300) bg-(--primary-50) px-2.5 py-1 text-xs font-semibold text-(--primary-800)";
  }

  return "inline-flex items-center rounded-full border border-white/80 bg-white/75 px-2 py-0.5 text-[11px] font-semibold text-(--primary-700)";
}

export function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toInputTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildDateTimeFromEventDate(eventDate: string | null, time: string) {
  if (!eventDate) return "";
  const day = eventDate.slice(0, 10);
  const safeTime = time.trim();
  if (!day || !safeTime) return "";
  return `${day}T${safeTime}`;
}

export function formatEventDateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function normalizeTimeInput(value: string) {
  const raw = value.trim().replace(/\s+/g, "");
  if (!raw) return "";

  if (/^\d{1,2}$/.test(raw)) {
    const hours = Number(raw);
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, "0")}:00`;
    }
    return null;
  }

  if (/^\d{3,4}$/.test(raw)) {
    const padded = raw.padStart(4, "0");
    const hours = Number(padded.slice(0, 2));
    const minutes = Number(padded.slice(2, 4));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return null;
  }

  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addOneHour(value: string) {
  const normalized = normalizeTimeInput(value);
  if (!normalized) return "";
  const [hours, minutes] = normalized.split(":").map(Number);
  return `${String((hours + 1) % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function buildEditorState(
  mode: "create" | "edit",
  moment?: TimelineMoment,
  preset?: MomentSuggestion,
): EditorState {
  return {
    mode,
    momentId: moment?.id,
    title: preset?.title ?? moment?.title ?? "",
    kind: preset?.kind ?? moment?.kind ?? EventTimelineMomentKind.other,
    startsAt: toInputTime(moment?.startsAt),
    endsAt: toInputTime(moment?.endsAt),
    locationName: moment?.locationName ?? "",
    locationAddress: moment?.locationAddress ?? "",
    note: moment?.note ?? "",
  };
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

function getImplicitEnd(moments: TimelineMoment[], index: number) {
  const moment = moments[index];
  if (!moment) return null;

  if (moment.endsAt) {
    return new Date(moment.endsAt);
  }

  const startsAt = new Date(moment.startsAt);
  const nextSameDay = moments.find((candidate, candidateIndex) => {
    if (candidateIndex <= index) return false;
    const candidateStartsAt = new Date(candidate.startsAt);
    return isSameCalendarDay(startsAt, candidateStartsAt);
  });

  if (nextSameDay) {
    return new Date(nextSameDay.startsAt);
  }

  return getEndOfDay(startsAt);
}

export function getLiveMoments(
  moments: TimelineMoment[],
  canonical?: { currentMomentId?: string | null; nextMomentId?: string | null },
): LiveTimelineMoment[] {
  const now = new Date();
  const liveMoments = moments.map((moment, index) => {
    const startsAt = new Date(moment.startsAt);
    const effectiveEnd = getImplicitEnd(moments, index);

    let state: MomentExecutionState = "future";
    if (effectiveEnd && effectiveEnd <= now) state = "past";
    else if (effectiveEnd && startsAt <= now && now < effectiveEnd) state = "current";
    else if (!effectiveEnd && startsAt <= now) state = "current";

    return { ...moment, state };
  });

  const currentMomentId =
    canonical?.currentMomentId ??
    liveMoments.find((moment) => moment.state === "current")?.id ??
    null;
  const nextMomentId =
    canonical?.nextMomentId ??
    liveMoments.find((moment) => moment.state === "future")?.id ??
    null;

  return liveMoments.map((moment) => {
    if (moment.id === currentMomentId) {
      return { ...moment, state: "current" as const };
    }

    if (moment.id === nextMomentId) {
      return { ...moment, state: "next" as const };
    }

    return moment;
  });
}

export function getLiveSummary(liveMoments: LiveTimelineMoment[]): TimelineSummary {
  const current = liveMoments.find((moment) => moment.state === "current") ?? null;
  const next = liveMoments.find((moment) => moment.state === "next") ?? null;

  if (current) {
    return {
      mode: "current",
      primary: current,
      secondary: next,
    };
  }

  if (next) {
    return {
      mode: "next",
      primary: next,
      secondary: null,
    };
  }

  if (liveMoments.length > 0 && liveMoments.every((moment) => moment.state === "past")) {
    return { mode: "done" };
  }

  return null;
}

export function groupLiveMomentsByDay(liveMoments: LiveTimelineMoment[]): TimelineDayGroup[] {
  const byDay = new Map<string, LiveTimelineMoment[]>();

  for (const moment of liveMoments) {
    const dayKey = moment.startsAt.slice(0, 10);
    const current = byDay.get(dayKey) ?? [];
    current.push(moment);
    byDay.set(dayKey, current);
  }

  return Array.from(byDay.entries()).map(([day, items]) => ({
    day,
    label: formatDayLabel(items[0]?.startsAt ?? day),
    items,
    hasCurrent: items.some((item) => item.state === "current"),
    hasNext: items.some((item) => item.state === "next"),
  }));
}

export function getMomentRowClassName(state: MomentExecutionState) {
  return cn(
    "border-border bg-card rounded-2xl border p-4 shadow-sm",
    state === "past" && "border-border/70 bg-muted/20 text-muted-foreground opacity-70",
    state === "current" &&
      "border-(--primary-400) bg-linear-to-br from-(--primary-50) to-white shadow-md ring-2 ring-(--primary-300)",
    state === "next" &&
      "border-(--primary-200) bg-(--primary-50)/55 ring-1 ring-(--primary-100)",
  );
}
