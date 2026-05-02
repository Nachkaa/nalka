"use client";

import { setEventLocationBySlug } from "@/features/events/server/event-details";
import { applyPollOptionToEvent, closePollById } from "@/features/polls/server/mutations";
import { DecidePollOptionDialog } from "@/features/polls/components/DecidePollOptionDialog";
import { getRecommendedOptionId, isRecommendationStrong } from "@/features/polls/lib/poll-utils";
import type { EventPollVM } from "@/features/polls/types";
import { EventPollStatus, EventPollType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { LocationSetupDialog } from "./LocationSetupDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
  initialLocation?: string | null;
  locationPoll?: EventPollVM | null;
  meId: string;
  enabled?: boolean;
};

export function LocationSetupEntryPoint({
  open,
  onOpenChange,
  eventId,
  slug,
  initialLocation,
  locationPoll,
  meId,
  enabled = true,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasUserSelection, setHasUserSelection] = useState(false);

  const openPoll =
    locationPoll &&
    locationPoll.type === EventPollType.LOCATION &&
    locationPoll.status === EventPollStatus.OPEN &&
    locationPoll.isActive
      ? locationPoll
      : null;
  const currentFinalValue = initialLocation?.trim() ? initialLocation.trim() : null;

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

  const onApplyManual = (value: string) => {
    const v = value.trim();
    if (!v) return;

    startTransition(async () => {
      await setEventLocationBySlug(slug, v);

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
    <LocationSetupDialog
      open={open}
      onOpenChange={onOpenChange}
      eventId={eventId}
      slug={slug}
      initialLocation={initialLocation}
    />
  );
}
