// app/(app)/event/[slug]/_components/poll/PollOptionsDetails.tsx
"use client";

import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { getDensity, votersLabel } from "./pollUtils";

export function PollOptionsDetails({
  poll,
  meId,
  totalMembers,
  canVote,
  isPending,
  onToggleVote,
}: {
  poll: EventPollVM;
  meId: string;
  totalMembers: number;
  canVote: boolean;
  isPending: boolean;
  onToggleVote: (pollOptionId: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {poll.options.map((o) => {
        const who = votersLabel(o.voters, meId);
        const votesCount = o.count;
        const densityWidth = getDensity(votesCount, totalMembers);
        const clickable = poll.status === "OPEN" && canVote && !isPending;

        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onToggleVote(o.id)}
              className={cn(
                "relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition",
                clickable &&
                  "cursor-pointer hover:bg-[color-mix(in_oklch,var(--primary),white_96%)] active:bg-[color-mix(in_oklch,var(--primary),white_92%)]",
                o.checked &&
                  "border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_92%)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),white_70%)]",
                !clickable && "cursor-default opacity-70",
              )}
            >
              {votesCount > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg bg-[var(--primary)]/8"
                  style={{ width: `${densityWidth}%`, transition: "width 0.5s ease" }}
                />
              )}

              <div className="relative min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{o.label}</span>
                  {votesCount > 0 && (
                    <span className="inline-flex items-center rounded-sm bg-[var(--accent)]/40 px-2 py-0.5 text-[10px] font-medium">
                      {votesCount} vote{votesCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {who && (
                  <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
                    <UserPlus className="mr-1 h-3 w-3" />
                    {who}
                  </p>
                )}
              </div>

              <span
                className={cn(
                  "relative inline-flex items-center rounded-sm border px-2 py-1 text-[11px] font-medium",
                  o.checked
                    ? "border-[var(--primary)] bg-white/85 text-[var(--primary)]"
                    : "text-muted-foreground border-[var(--border)] bg-white/70",
                )}
              >
                {o.checked ? "J’annule" : "Je vote"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
