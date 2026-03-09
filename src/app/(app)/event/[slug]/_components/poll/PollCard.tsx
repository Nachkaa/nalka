// app/(app)/event/[slug]/_components/poll/PollCard.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { EventPollStatus, EventPollType } from "@prisma/client";
import { BarChart3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { setEventDateBySlug, setEventLocationBySlug } from "../../actions/event";
import { applyPollOptionToEvent, closePollById, togglePollVote } from "../../actions/polls";
import { AddPollOptionDialog } from "./AddPollOptionDialog";
import { DecidePollOptionDialog } from "./DecidePollOptionDialog";
import { PollDetailsDialog } from "./PollDetailsDialog";
import { PollOptionsCompact } from "./PollOptionsCompact";
import { getDefineLabel, getRecommendedOptionId, isRecommendationStrong } from "./pollUtils";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDaysISO(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function addMonthsISO(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function fmtIsoFR(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(d); // 08/02
}

export function PollCard({
  poll,
  slug,
  canEdit,
  totalMembers,
  meId,
}: {
  poll: EventPollVM;
  slug: string;
  canEdit: boolean;
  totalMembers: number;
  meId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [openAdd, setOpenAdd] = useState(false);
  const [decideOpen, setDecideOpen] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const isOpen = poll.status === EventPollStatus.OPEN;
  const canAdd = canEdit && isOpen;
  const canVote = isOpen;
  const empty = poll.options.length === 0;

  const isSchedule = poll.type === EventPollType.SCHEDULE;
  const emptyTitle = isSchedule ? "Ajoute des dates" : "Ajoute des options";
  const emptyHint = (() => {
    if (!isSchedule) {
      return "Ex: restaurants, villes, adresses… pour que les gens puissent voter.";
    }

    const base = startOfDay(new Date());
    const d1 = addDaysISO(base, 7);
    const d2 = addDaysISO(base, 14);
    const d3 = addMonthsISO(base, 1);

    return `Ex: ${fmtIsoFR(d1)}, ${fmtIsoFR(d2)}, ${fmtIsoFR(d3)}… pour que les gens puissent voter.`;
  })();

  const title =
    poll.type === EventPollType.SCHEDULE
      ? "Sondage — Date de l'événement"
      : "Sondage — Lieu de l'événement";

  const decisionEnabled = canEdit && isOpen && poll.options.length > 0;

  const recommendedOptionId = useMemo(
    () => getRecommendedOptionId(poll.options.map((o) => ({ id: o.id, count: o.count }))),
    [poll.options],
  );

  const recommendedCount = poll.options.find((o) => o.id === recommendedOptionId)?.count ?? 0;

  const strong = isRecommendationStrong(
    poll.options.map((o) => ({ count: o.count })),
    recommendedCount,
  );

  const defineLabel = getDefineLabel(poll.type);

  const onToggleVote = (pollOptionId: string) => {
    if (!canVote) return;
    startTransition(async () => {
      await togglePollVote({ slug, pollOptionId });
      router.refresh();
    });
  };

  const openDecision = () => {
    if (!decisionEnabled) return;
    setSelectedOptionId(recommendedOptionId);
    setDecideOpen(true);
  };

  const onApplyDecision = () => {
    if (!selectedOptionId) return;
    startTransition(async () => {
      await applyPollOptionToEvent({ slug, pollOptionId: selectedOptionId, closePoll: true });
      setDecideOpen(false);
      router.refresh();
    });
  };

  const onApplyManual = (value: string) => {
    const v = value.trim();
    if (!v) return;

    startTransition(async () => {
      if (poll.type === EventPollType.SCHEDULE) {
        await setEventDateBySlug(slug, v);
      } else if (poll.type === EventPollType.LOCATION) {
        await setEventLocationBySlug(slug, v);
      }

      if (poll) {
        await closePollById(poll.id, slug);
      }

      setDecideOpen(false);
      router.refresh();
    });
  };

  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <Card size="sm" variant="ghost" inset="none">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                {title}
              </span>
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isOpen ? "secondary" : "outline"}>{isOpen ? "Ouvert" : "Fermé"}</Badge>

            {/* Détails = admin only (ou canEdit) */}
            {!empty && canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-sm px-2.5 text-[11px]"
                onClick={() => setDetailsOpen(true)}
              >
                Détails
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {empty ? (
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => canAdd && setOpenAdd(true)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 text-left disabled:opacity-60"
            >
              <div>
                <p className="text-sm font-medium">{emptyTitle}</p>
                <p className="text-muted-foreground text-xs">{emptyHint}</p>
              </div>

              {canAdd && (
                <span className="bg-primary text-primary-foreground inline-flex items-center rounded-sm px-3 py-1 text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </span>
              )}
            </button>
          ) : (
            <PollOptionsCompact
              poll={poll}
              canVote={canVote}
              totalMembers={totalMembers}
              isPending={isPending}
              onToggleVote={onToggleVote}
            />
          )}

          {/* Actions footer (alignés) */}
          {(canAdd || decisionEnabled) && !empty && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {canAdd && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpenAdd(true)}
                    className="w-full sm:w-auto"
                    disabled={isPending}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Ajouter un élément
                  </Button>
                )}
              </div>

              <div>
                {decisionEnabled && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={openDecision}
                    className="w-full sm:w-auto"
                    disabled={isPending}
                  >
                    {defineLabel}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DecidePollOptionDialog
        poll={poll}
        meId={meId}
        open={decideOpen}
        onOpenChange={setDecideOpen}
        isPending={isPending}
        recommendedOptionId={recommendedOptionId}
        isRecommendationStrong={strong}
        selectedOptionId={selectedOptionId}
        setSelectedOptionId={setSelectedOptionId}
        onApplyDecision={onApplyDecision}
        onApplyManual={onApplyManual}
      />

      <AddPollOptionDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        slug={slug}
        pollId={poll.id}
        pollType={poll.type}
      />

      <PollDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        poll={poll}
        slug={slug}
        isPending={isPending}
      />
    </>
  );
}
