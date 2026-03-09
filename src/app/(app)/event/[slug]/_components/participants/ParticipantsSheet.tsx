"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useMediaQuery } from "@/lib/use-media-query";
import { EventRsvpStatus } from "@prisma/client";
import { useMemo, useState } from "react";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { ParticipantRow, ParticipantsCounts, ParticipantsFilter } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: ParticipantRow[];
  canManage: boolean;
  eventId: string;
  slug: string;
};

function computeCounts(list: ParticipantRow[]): ParticipantsCounts {
  return list.reduce<ParticipantsCounts>(
    (acc, p) => {
      acc.total += 1;
      switch (p.rsvpStatus) {
        case EventRsvpStatus.GOING:
          acc.going += 1;
          break;
        case EventRsvpStatus.MAYBE:
          acc.maybe += 1;
          break;
        case EventRsvpStatus.NOT_GOING:
          acc.notGoing += 1;
          break;
        default:
          acc.pending += 1;
      }
      return acc;
    },
    { total: 0, going: 0, maybe: 0, notGoing: 0, pending: 0 },
  );
}

export function ParticipantsSheet({
  open,
  onOpenChange,
  participants,
  canManage,
  eventId,
  slug,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ParticipantsFilter>("ALL");
  const [inviteOpen, setInviteOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const counts = useMemo(() => computeCounts(participants), [participants]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return participants.filter((p) => {
      const matchesFilter = filter === "ALL" ? true : p.rsvpStatus === filter;
      const matchesSearch =
        !term ||
        (p.name ?? "").toLowerCase().includes(term) ||
        (p.email ?? "").toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [participants, filter, search]);

  const resetAndClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setInviteOpen(false);
  };

  const panel = (
    <div className="flex h-dvh max-h-[88vh] flex-col">
      <ParticipantsPanel
        counts={counts}
        filtered={filtered}
        search={search}
        filter={filter}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        canManage={canManage}
        eventId={eventId}
        slug={slug}
        inviteOpen={inviteOpen}
        onInviteOpenChange={setInviteOpen}
        onClose={() => resetAndClose(false)}
        variant={isDesktop ? "desktop" : "mobile"}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[560px] [&>button:last-child]:hidden">
          <VisuallyHidden>
            <DialogTitle>Participants</DialogTitle>
          </VisuallyHidden>

          {panel}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={resetAndClose}>
      <SheetContent
        side="bottom"
        className="bg-background h-dvh max-h-[88vh] overflow-hidden rounded-t-3xl border-t p-0 sm:max-h-[88vh] [&>button:last-child]:hidden"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Participants</SheetTitle>
          </SheetHeader>
        </VisuallyHidden>
        {panel}
      </SheetContent>
    </Sheet>
  );
}
