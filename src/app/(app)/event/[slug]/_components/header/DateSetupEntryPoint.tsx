// src/app/(app)/event/[slug]/_components/header/DateSetupEntryPoint.tsx
"use client";

import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { formatEventDateTime } from "@/lib/dates/format-date";
import { EventPollStatus, EventPollType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { setEventDateBySlug } from "../../actions/event"; // ✅ à adapter au vrai chemin/nom
import { applyPollOptionToEvent, closePollById } from "../../actions/polls";
import { DecidePollOptionDialog } from "../poll/DecidePollOptionDialog";
import { getRecommendedOptionId, isRecommendationStrong } from "../poll/pollUtils";
import { DateSetupDialog } from "./DateSetupDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
  initialDate?: string | null;
  schedulePoll?: EventPollVM | null;
  meId: string;
  enabled?: boolean;
};

export function DateSetupEntryPoint({
  open,
  onOpenChange,
  eventId,
  slug,
  initialDate,
  schedulePoll,
  meId,
  enabled = true,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasUserSelection, setHasUserSelection] = useState(false);

  const openPoll =
    schedulePoll &&
    schedulePoll.type === EventPollType.SCHEDULE &&
    schedulePoll.status === EventPollStatus.OPEN &&
    schedulePoll.isActive
      ? schedulePoll
      : null;
  const currentFinalValue = initialDate ? formatEventDateTime(initialDate, null) : null;

  const recommendedOptionId = useMemo(
    () =>
      openPoll
        ? getRecommendedOptionId(openPoll.options.map((o) => ({ id: o.id, count: o.count })))
        : null,
    [openPoll],
  );

  const strongRecommendation = useMemo(
    () =>
      openPoll
        ? isRecommendationStrong(
            openPoll.options.map((o) => ({ count: o.count })),
            openPoll.options.find((o) => o.id === recommendedOptionId)?.count ?? 0,
          )
        : false,
    [openPoll, recommendedOptionId],
  );

  const effectiveSelectedOptionId = hasUserSelection
    ? selectedOptionId
    : open
      ? recommendedOptionId
      : null;

  const handleSelectedOptionIdChange = (id: string | null) => {
    setHasUserSelection(true);
    setSelectedOptionId(id);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedOptionId(null);
      setHasUserSelection(false);
    }
    onOpenChange(nextOpen);
  };

  const onApplyDecision = () => {
    if (!selectedOptionId) return;
    startTransition(async () => {
      await applyPollOptionToEvent({ slug, pollOptionId: selectedOptionId, closePoll: true });
      onOpenChange(false);
      router.refresh();
    });
  };

  const onApplyManual = (iso: string) => {
    const value = iso.trim();
    if (!value) return;

    startTransition(async () => {
      await setEventDateBySlug(slug, value);
      if (openPoll) {
        await closePollById(openPoll.id, slug);
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  if (!enabled) return null;

  if (openPoll) {
    return (
      <DecidePollOptionDialog
        poll={openPoll}
        meId={meId}
        open={open}
        onOpenChange={handleOpenChange}
        isPending={isPending}
        recommendedOptionId={recommendedOptionId}
        isRecommendationStrong={strongRecommendation}
        selectedOptionId={effectiveSelectedOptionId}
        setSelectedOptionId={handleSelectedOptionIdChange}
        onApplyDecision={onApplyDecision}
        onApplyManual={onApplyManual}
        currentFinalValue={currentFinalValue}
      />
    );
  }

  return (
    <DateSetupDialog
      open={open}
      onOpenChange={onOpenChange}
      eventId={eventId}
      slug={slug}
      initialDate={initialDate}
    />
  );
}
