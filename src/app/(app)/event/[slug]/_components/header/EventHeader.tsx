// src/app/(app)/event/[slug]/_components/header/EventHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { formatEventDateTime } from "@/lib/dates/format-date";
import type {
  EventGiftMode,
  EventLocationMode,
  EventMemberRole,
  EventRsvpStatus,
  EventScheduleMode,
} from "@prisma/client";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddParticipantLauncher } from "../participants/AddParticipantLauncher";
import { DateSetupEntryPoint } from "./DateSetupEntryPoint";
import { EventHeaderActions } from "./EventHeaderActions";
import { LocationSetupEntryPoint } from "./LocationSetupEntryPoint";
import { ParticipantsSummary } from "./ParticipantsSummary";

type EventHeaderEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;

  eventOn: string | null;
  eventTime: string | null;
  location: string | null;

  scheduleMode: EventScheduleMode;
  locationMode: EventLocationMode;

  colorHex: string;

  giftMode: EventGiftMode;
  isNoSpoil: boolean;
  isAnonReservations: boolean;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
  budgetCapCents: number | null;

  hasBringSection: boolean;
  rsvpRequired: boolean;
};

type Participant = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  rsvpStatus: EventRsvpStatus;
  role?: EventMemberRole | null;
};

type RsvpSummary = {
  going: number;
  maybe: number;
  notGoing: number;
  pending: number;
};

type Props = {
  event: EventHeaderEvent;
  slug: string;
  schedulePollOpen?: EventPollVM | null;
  locationPollOpen?: EventPollVM | null;
  meId: string;

  isAdmin: boolean;
  canEditEvent: boolean;
  canEditEventMeta: boolean;

  showBudget: boolean;

  participants: Participant[];
  rsvpSummary: RsvpSummary;
};

export function EventHeader({
  event,
  slug,
  schedulePollOpen,
  locationPollOpen,
  meId,
  isAdmin,
  canEditEvent,
  canEditEventMeta,
  participants,
  rsvpSummary,
}: Props) {
  const [locOpen, setLocOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const hasDate = Boolean(event.eventOn);
  const hasTime = Boolean(event.eventTime);
  const hasScheduleInfo = hasDate || hasTime;
  const hasLocation = Boolean(event.location);

  const dateLabel = formatEventDateTime(event.eventOn, event.eventTime);
  const locationLabel = event.location ?? "Lieu à définir";
  const canInvite = canEditEvent;

  const summaryContent = (
    <ParticipantsSummary participants={participants} summary={rsvpSummary} compact />
  );

  const summaryTrigger = (
    <Link
      href={`/event/${slug}/participants`}
      className="hover:bg-muted/60 flex items-center gap-2 rounded-full px-2 py-1 transition focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="Voir les participants"
    >
      {summaryContent}
    </Link>
  );

  return (
    <>
      <div className="pb-1">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground h-7 px-1 text-xs">
          <Link href="/event" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Revenir à mes événements
          </Link>
        </Button>
      </div>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-foreground min-w-0 text-2xl leading-tight font-semibold text-pretty sm:text-3xl">
            {event.title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <EventHeaderActions slug={slug} isAdmin={isAdmin} title={event.title} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {canEditEventMeta ? (
              <Button
                type="button"
                variant="soft"
                size="sm"
                className="h-8 rounded-full px-3 text-xs font-semibold"
                onClick={() => setDateDialogOpen(true)}
                aria-label={hasScheduleInfo ? "Modifier la date" : "Définir la date"}
                title={hasScheduleInfo ? dateLabel : "Date à définir"}
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-[200px] truncate">
                  {hasScheduleInfo ? dateLabel : "Date à définir"}
                </span>
              </Button>
            ) : (
              <span
                className="bg-muted text-foreground inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                title={hasScheduleInfo ? dateLabel : "Date à définir"}
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-[200px] truncate">
                  {hasScheduleInfo ? dateLabel : "Date à définir"}
                </span>
              </span>
            )}

            {canEditEventMeta ? (
              <Button
                type="button"
                variant="soft"
                size="sm"
                className="h-8 rounded-full px-3 text-xs font-semibold"
                onClick={() => setLocOpen(true)}
                aria-label={hasLocation ? "Modifier le lieu" : "Définir le lieu"}
                title={hasLocation ? locationLabel : "Lieu à définir"}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-[220px] truncate">{locationLabel}</span>
              </Button>
            ) : (
              <span
                className="bg-muted text-foreground inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                title={hasLocation ? locationLabel : "Lieu à définir"}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-[220px] truncate">{locationLabel}</span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {summaryTrigger}
            {canInvite ? <AddParticipantLauncher eventId={event.id} slug={slug} context="header" /> : null}
          </div>
        </div>
      </header>

      <DateSetupEntryPoint
        open={dateDialogOpen}
        onOpenChange={setDateDialogOpen}
        eventId={event.id}
        slug={slug}
        initialDate={event.eventOn}
        schedulePoll={schedulePollOpen ?? null}
        meId={meId}
        enabled={canEditEventMeta}
      />

      <LocationSetupEntryPoint
        open={locOpen}
        onOpenChange={setLocOpen}
        eventId={event.id}
        slug={slug}
        initialLocation={event.location}
        locationPoll={locationPollOpen ?? null}
        meId={meId}
        enabled={canEditEventMeta}
      />
    </>
  );
}
