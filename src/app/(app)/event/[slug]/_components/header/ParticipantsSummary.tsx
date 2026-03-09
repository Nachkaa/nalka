// src/app/(app)/event/[slug]/_components/header/ParticipantsSummary.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { EventRsvpStatus } from "@prisma/client";

type Participant = {
  id: string;
  name: string | null;
  imageUrl: string | null;
  rsvpStatus: EventRsvpStatus;
};

type Summary = {
  going: number;
  maybe: number;
  notGoing: number;
  pending: number;
};

type Props = {
  participants: Participant[];
  summary: Summary;
  compact?: boolean;
};

const MAX_VISIBLE = 5;
const COMPACT_VISIBLE = 2;

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last || first).toUpperCase();
}

function verb(count: number) {
  return count === 1 ? "vient" : "viennent";
}

export function ParticipantsSummary({ participants, summary, compact = false }: Props) {
  const maxVisible = compact ? COMPACT_VISIBLE : MAX_VISIBLE;
  const visible = participants.slice(0, maxVisible);
  const extra = Math.max(0, participants.length - maxVisible);

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-nowrap items-center gap-2 text-sm",
        compact && "min-w-0 whitespace-nowrap",
      )}
    >
      <div className="flex shrink-0 items-center -space-x-2">
        {visible.map((person) => (
          <Avatar key={person.id} className="ring-background h-8 w-8 ring-2">
            <AvatarImage src={person.imageUrl ?? undefined} alt={person.name ?? "Invité"} />
            <AvatarFallback
              className={cn(
                "bg-muted text-[11px] font-semibold uppercase",
                !person.imageUrl && "text-foreground",
              )}
            >
              {getInitials(person.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 && (
          <div className="bg-muted text-foreground ring-background flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ring-2">
            +{extra}
          </div>
        )}
      </div>

      <div className={cn("whitespace-nowrap", compact ? "shrink-0 truncate" : "")}>
        <span className="text-foreground font-semibold">{summary.going}</span> {verb(summary.going)}
      </div>
    </div>
  );
}
