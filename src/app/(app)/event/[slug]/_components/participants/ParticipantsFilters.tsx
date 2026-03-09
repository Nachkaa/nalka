import { EventRsvpStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ParticipantsCounts, ParticipantsFilter } from "./types";

type Props = {
  active: ParticipantsFilter;
  counts: ParticipantsCounts;
  onChange: (value: ParticipantsFilter) => void;
};

const FILTERS: Array<{
  key: ParticipantsFilter;
  label: string;
  getCount: (c: ParticipantsCounts) => number;
}> = [
  { key: "ALL", label: "Tous", getCount: (c) => c.total },
  { key: EventRsvpStatus.GOING, label: "Viennent", getCount: (c) => c.going },
  { key: EventRsvpStatus.MAYBE, label: "Peut-être", getCount: (c) => c.maybe },
  { key: EventRsvpStatus.NOT_GOING, label: "Ne viennent pas", getCount: (c) => c.notGoing },
  { key: EventRsvpStatus.PENDING, label: "En attente", getCount: (c) => c.pending },
];

function chipClasses(isActive: boolean) {
  if (isActive) {
    return "bg-(--primary-100) text-(--primary-700) border-(--primary-200)";
  }
  return "bg-background text-muted-foreground border-border hover:bg-muted/40";
}

export function ParticipantsFilters({ active, counts, onChange }: Props) {
  const hasPending = counts.pending > 0;
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.filter((f) => f.key !== EventRsvpStatus.PENDING || hasPending).map((filter) => {
        const isActive = active === filter.key;
        const count = filter.getCount(counts);
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange(filter.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none",
              chipClasses(isActive),
            )}
          >
            <span className="whitespace-nowrap">{filter.label}</span>
            <span className="text-foreground rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold shadow-sm">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
