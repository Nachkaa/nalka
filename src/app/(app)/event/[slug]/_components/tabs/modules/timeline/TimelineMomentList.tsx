"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import type { LiveTimelineMoment, TimelineDayGroup } from "./types";
import { TimelineMomentRow } from "./TimelineMomentRow";

type TimelineMomentListProps = {
  groups: TimelineDayGroup[];
  canEdit: boolean;
  onEdit: (moment: LiveTimelineMoment) => void;
  onDelete: (moment: LiveTimelineMoment) => void;
  liveMomentRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
};

export function TimelineMomentList({
  groups,
  canEdit,
  onEdit,
  onDelete,
  liveMomentRefs,
}: TimelineMomentListProps) {
  return (
    <>
      {groups.map((group) => (
        <section key={group.day} className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "bg-border h-px flex-1",
                (group.hasCurrent || group.hasNext) && "bg-(--primary-200)",
              )}
            />
            <p
              className={cn(
                "text-muted-foreground text-xs font-semibold uppercase",
                (group.hasCurrent || group.hasNext) && "text-foreground",
              )}
            >
              {group.label}
            </p>
            <div
              className={cn(
                "bg-border h-px flex-1",
                (group.hasCurrent || group.hasNext) && "bg-(--primary-200)",
              )}
            />
          </div>

          <div className="space-y-3">
            {group.items.map((moment) => (
              <TimelineMomentRow
                key={moment.id}
                moment={moment}
                canEdit={canEdit}
                onEdit={onEdit}
                onDelete={onDelete}
                rowRef={(node) => {
                  liveMomentRefs.current[moment.id] = node;
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
