// app/(app)/event/[slug]/_components/poll/PollOptionsCompact.tsx
"use client";

import { cn } from "@/lib/utils";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { getDensity } from "./pollUtils";

export function PollOptionsCompact({
  poll,
  canVote,
  isPending,
  totalMembers,
  onToggleVote,
}: {
  poll: EventPollVM;
  canVote: boolean;
  totalMembers: number;
  isPending: boolean;
  onToggleVote: (pollOptionId: string) => void;
}) {
  return (
    <ul className="border-border/60 bg-background/30 divide-y overflow-hidden rounded-md border">
      {poll.options.map((o) => {
        const votesCount = o.count;
        const clickable = poll.status === "OPEN" && canVote && !isPending;
        const densityWidth = getDensity(votesCount, totalMembers);

        return (
          <li key={o.id} className="relative">
            {votesCount > 0 && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0",
                  // global density (light)
                  !o.checked && "bg-[var(--primary)]/6",
                  // my vote (denser)
                  o.checked && "bg-[var(--primary)]/14",
                )}
                style={{ width: `${densityWidth}%`, transition: "width 0.35s ease" }}
              />
            )}

            <button
              type="button"
              disabled={!clickable}
              aria-pressed={o.checked}
              onClick={() => onToggleVote(o.id)}
              className={cn(
                "relative flex w-full items-center gap-2 px-2.5 py-1 text-left text-[13px] leading-5 transition",
                clickable && "hover:bg-muted/25 active:bg-muted/40 cursor-pointer",
                !clickable && "cursor-default opacity-70",
                // highlight mine without hiding the density bar
                o.checked && "ring-1 ring-[var(--primary)]/35",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-sm border")}
              >
                <span className={cn("h-2 w-2 rounded-sm transition")} />
              </span>

              <span
                className={cn("min-w-0 flex-1 truncate font-medium", o.checked && "font-semibold")}
              >
                {o.label}
              </span>

              <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                {votesCount > 0 ? votesCount : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
