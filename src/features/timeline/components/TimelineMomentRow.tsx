"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MapPin, MoreHorizontal, NotebookText, Pencil, Trash2 } from "lucide-react";

import { executionBadgeClass, formatTime, getMomentRowClassName } from "../lib/timeline-utils";
import type { LiveTimelineMoment } from "../types";

type TimelineMomentRowProps = {
  moment: LiveTimelineMoment;
  canEdit: boolean;
  onEdit: (moment: LiveTimelineMoment) => void;
  onDelete: (moment: LiveTimelineMoment) => void;
  rowRef?: (node: HTMLDivElement | null) => void;
};

export function TimelineMomentRow({
  moment,
  canEdit,
  onEdit,
  onDelete,
  rowRef,
}: TimelineMomentRowProps) {
  return (
    <div ref={rowRef} className={getMomentRowClassName(moment.state)}>
      <div className="flex items-start gap-4">
        <div className="min-w-[84px] shrink-0">
          <p
            className={cn(
              "text-foreground text-sm font-semibold",
              moment.state === "past" && "text-muted-foreground",
              moment.state === "current" && "text-(--primary-800)",
            )}
          >
            {formatTime(moment.startsAt)}
          </p>
          {moment.endsAt ? (
            <p className="text-muted-foreground text-sm">{formatTime(moment.endsAt)}</p>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-foreground font-semibold",
                    moment.state === "past" && "text-foreground/70",
                    moment.state === "current" && "text-(--primary-900) text-[15px]",
                  )}
                >
                  {moment.title}
                </p>
                {moment.state === "current" ? (
                  <span className={executionBadgeClass("current")}>En cours</span>
                ) : null}
                {moment.state === "next" ? (
                  <span className={executionBadgeClass("next")}>À venir</span>
                ) : null}
              </div>
            </div>

            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Actions pour ${moment.title}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(moment)}>
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(moment)}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {moment.locationName || moment.locationAddress ? (
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-0.5">
                {moment.locationName ? <p>{moment.locationName}</p> : null}
                {moment.locationAddress ? <p>{moment.locationAddress}</p> : null}
              </div>
            </div>
          ) : null}

          {moment.note ? (
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <NotebookText className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{moment.note}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
