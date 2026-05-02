"use client";

import { cn } from "@/lib/utils";

import { getDensity } from "../lib/poll-utils";
import type { EventPollVM } from "../types";

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
      {poll.options.map((option) => {
        const votesCount = option.count;
        const clickable = poll.status === "OPEN" && canVote && !isPending;
        const densityWidth = getDensity(votesCount, totalMembers);

        return (
          <li key={option.id} className="relative">
            {votesCount > 0 ? (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0",
                  !option.checked && "bg-[var(--primary)]/6",
                  option.checked && "bg-[var(--primary)]/14",
                )}
                style={{ width: `${densityWidth}%`, transition: "width 0.35s ease" }}
              />
            ) : null}

            <button
              type="button"
              disabled={!clickable}
              aria-pressed={option.checked}
              onClick={() => onToggleVote(option.id)}
              className={cn(
                "relative flex w-full items-center gap-2 px-2.5 py-1 text-left text-[13px] leading-5 transition",
                clickable && "hover:bg-muted/25 active:bg-muted/40 cursor-pointer",
                !clickable && "cursor-default opacity-70",
                option.checked && "ring-1 ring-[var(--primary)]/35",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-sm border")}
              >
                <span className={cn("h-2 w-2 rounded-sm transition")} />
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-medium",
                  option.checked && "font-semibold",
                )}
              >
                {option.label}
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
