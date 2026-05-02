"use client";

import { MapPin, NotebookText } from "lucide-react";

import { executionBadgeClass, formatTime } from "../lib/timeline-utils";
import type { TimelineSummary } from "../types";

type TimelineSummaryCardProps = {
  summary: TimelineSummary;
};

export function TimelineSummaryCard({ summary }: TimelineSummaryCardProps) {
  if (!summary) return null;

  if (summary.mode === "done") {
    return (
      <section className="border-border bg-card rounded-2xl border p-4 text-sm text-muted-foreground shadow-sm">
        Programme terminé
      </section>
    );
  }

  const isCurrent = summary.mode === "current";

  return (
    <section
      className={
        isCurrent
          ? "rounded-2xl border border-(--primary-400) bg-linear-to-br from-(--primary-50) via-white to-(--primary-50) p-5 shadow-md ring-2 ring-(--primary-200)"
          : "rounded-2xl border border-(--primary-200) bg-(--primary-50)/70 p-5 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <span className={executionBadgeClass(isCurrent ? "current" : "next")}>
            {isCurrent ? "En cours" : "À venir"}
          </span>
          <h3 className="text-2xl font-semibold tracking-tight">{summary.primary.title}</h3>
          <p className="text-sm font-semibold text-foreground/90">
            {formatTime(summary.primary.startsAt)}
            {summary.primary.endsAt ? ` - ${formatTime(summary.primary.endsAt)}` : ""}
          </p>
        </div>
      </div>

      {summary.primary.locationName || summary.primary.locationAddress ? (
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-0.5">
            {summary.primary.locationName ? <p>{summary.primary.locationName}</p> : null}
            {summary.primary.locationAddress ? <p>{summary.primary.locationAddress}</p> : null}
          </div>
        </div>
      ) : null}

      {summary.primary.note ? (
        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <NotebookText className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{summary.primary.note}</p>
        </div>
      ) : null}

      {summary.mode === "current" && summary.secondary ? (
        <div className="mt-4 rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <span className={executionBadgeClass("follow")}>À suivre</span>
            <span>
              {summary.secondary.title} · {formatTime(summary.secondary.startsAt)}
              {summary.secondary.endsAt ? ` - ${formatTime(summary.secondary.endsAt)}` : ""}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
