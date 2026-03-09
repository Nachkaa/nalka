"use client";

import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParticipantsFilters } from "./ParticipantsFilters";
import { ParticipantsRow } from "./ParticipantsRow";
import { ParticipantsCounts, ParticipantsFilter, ParticipantRow } from "./types";
import { AddParticipantLauncher } from "./AddParticipantLauncher";

type Props = {
  counts: ParticipantsCounts;
  filtered: ParticipantRow[];
  search: string;
  filter: ParticipantsFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ParticipantsFilter) => void;
  canManage: boolean;
  eventId: string;
  slug: string;
  inviteOpen: boolean;
  onInviteOpenChange: (open: boolean) => void;
  onClose: () => void;
  variant: "mobile" | "desktop";
};

export function ParticipantsPanel({
  counts,
  filtered,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  canManage,
  eventId,
  slug,
  inviteOpen,
  onInviteOpenChange,
  onClose,
  variant,
}: Props) {
  const hasResults = filtered.length > 0;
  const titleId = useMemo(() => "participants-title", []);
  const descId = useMemo(() => "participants-desc", []);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="border-border flex flex-col gap-3 border-b px-5 pt-3 pb-4">
        {variant === "mobile" && (
          <div className="bg-muted mx-auto h-1 w-12 rounded-full md:hidden" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 id={titleId} className="text-lg leading-tight font-semibold">
              Participants
            </h3>
            <p id={descId} className="text-muted-foreground text-sm">
              Gérer les invités et leurs réponses
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted/70 inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Rechercher par nom ou e-mail"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-muted/50 h-11 rounded-xl pl-10 text-sm"
              aria-label="Rechercher un participant"
            />
          </div>

          <ParticipantsFilters active={filter} counts={counts} onChange={onFilterChange} />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 px-5 py-4 pb-28">
          {hasResults ? (
            filtered.map((p) => (
              <ParticipantsRow key={p.id} participant={p} canManage={canManage} slug={slug} />
            ))
          ) : (
            <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
              Aucun participant trouvé.
            </div>
          )}
        </div>
      </ScrollArea>

      {canManage && (
        <div className="border-border bg-background sticky bottom-0 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-6px_24px_-18px_rgb(0_0_0_/_0.35)]">
          <AddParticipantLauncher
            eventId={eventId}
            slug={slug}
            context="participants"
            open={inviteOpen}
            onOpenChange={onInviteOpenChange}
          />
        </div>
      )}
    </div>
  );
}
