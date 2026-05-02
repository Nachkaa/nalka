"use client";

import { updateRsvp } from "@/app/(app)/event/[slug]/actions/rsvp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { EventSummary } from "@/features/events/types";
import { cn } from "@/lib/utils";
import { EventRsvpStatus } from "@prisma/client";
import { Calendar, ChevronDown, ChevronRight, Loader2, MapPin, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = { initialEvents: EventSummary[] };

export function EventList({ initialEvents }: Props) {
  const [events, setEvents] = useState<EventSummary[]>(initialEvents);
  const [activeRsvpId, setActiveRsvpId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { heroEvent, upcomingList, past } = useMemo(() => {
    const datedUpcoming = events
      .filter((e) => e.date && e.date >= todayISO)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    const undated = events.filter((e) => !e.date);
    const pastEvents = events
      .filter((e) => e.date && e.date < todayISO)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    const topEvent = datedUpcoming[0] ?? null;
    const remainingUpcoming = [...datedUpcoming.slice(1), ...undated];

    return { heroEvent: topEvent, upcomingList: remainingUpcoming, past: pastEvents };
  }, [events, todayISO]);

  const handleRsvp = (event: EventSummary, status: EventRsvpStatus) => {
    setActiveRsvpId(event.id);
    startTransition(async () => {
      const res = await updateRsvp({
        eventId: event.id,
        status,
      });

      if (!res.ok) {
        toast.error("Impossible d'enregistrer. Réessaie.");
        setActiveRsvpId(null);
        return;
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                rsvpStatus: status,
                rsvpRespondedAt: res.respondedAt ?? new Date().toISOString(),
              }
            : e,
        ),
      );

      setActiveRsvpId(null);
    });
  };

  if (events.length === 0) {
    return (
      <Card className="bg-card/80 rounded-2xl border p-8 text-center">
        <div className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">Mes événements</h2>
          <p className="text-muted-foreground text-sm">
            Créez votre premier événement pour organiser vos cadeaux sans spoilers.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/event/new">Créer un événement</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-8">
      {heroEvent && (
        <HeroCard
          event={heroEvent}
          onRsvpChange={handleRsvp}
          isSubmitting={isPending && activeRsvpId === heroEvent.id}
          isActive={activeRsvpId === heroEvent.id}
        />
      )}

      {upcomingList.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>ÉVÉNEMENTS À VENIR</SectionTitle>
          <div className="space-y-3">
            {upcomingList.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="group text-muted-foreground flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-semibold tracking-[0.08em] uppercase">
              <SectionTitle>ÉVÉNEMENTS PASSÉS</SectionTitle>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", "data-[state=open]:rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {past.map((event) => (
                <EventRow key={event.id} event={event} muted />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </section>
  );
}

function HeroCard({
  event,
  onRsvpChange,
  isSubmitting,
  isActive,
}: {
  event: EventSummary;
  onRsvpChange: (event: EventSummary, status: EventRsvpStatus) => void;
  isSubmitting: boolean;
  isActive: boolean;
}) {
  const [isEditing, setIsEditing] = useState(event.rsvpStatus === EventRsvpStatus.PENDING);
  const organizer = isOrganizer(event);
  const roleLabel = isOrganizer(event) ? "Organisateur" : "Invité";
  const dateText = event.dateLabel ?? "Date à définir";
  const locationText = event.locationLabel ?? event.location;
  const statusLabel = STATUS_LABELS[event.rsvpStatus ?? EventRsvpStatus.PENDING];

  const showRsvp =
    !organizer &&
    event.rsvpRequired &&
    (!event.rsvpStatus || event.rsvpStatus === EventRsvpStatus.PENDING || isEditing);

  const handleSelect = (next: EventRsvpStatus) => {
    onRsvpChange(event, next);
    setIsEditing(false);
  };

  const href = `/event/${event.slug ?? event.id}`;

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => {
        window.location.href = href;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = href;
        }
      }}
      className={cn(
        "cursor-pointer overflow-hidden rounded-3xl border",
        "bg-linear-to-r from-(--card) to-[color-mix(in_oklch,var(--card),var(--primary)_8%)]",
        "transition hover:-translate-y-px hover:shadow-sm",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:items-stretch">
        <div className="bg-muted/60 relative overflow-hidden rounded-2xl border">
          <div className="absolute inset-0 bg-linear-to-tr from-black/35 via-transparent to-black/10" />
          {event.imagePath ? (
            <Image
              src={event.imagePath}
              alt={event.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full min-h-[220px] w-full bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.2),transparent_35%),radial-gradient(circle_at_60%_70%,rgba(59,130,246,0.22),transparent_35%)]" />
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-background/80 text-foreground backdrop-blur">
              {roleLabel}
            </Badge>
            {event.isSecretSanta && (
              <Badge className="bg-primary/90 text-primary-foreground">Secret Santa</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.22em] uppercase">
              Prochain événement
            </p>
            <h2 className="text-foreground text-3xl leading-tight font-semibold text-pretty sm:text-4xl">
              {event.title}
            </h2>
            <div className="text-muted-foreground flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              <span>{dateText}</span>
            </div>
            {locationText && (
              <div className="text-muted-foreground flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                <span>{locationText}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {showRsvp ? (
              <RsvpChoices
                value={event.rsvpStatus ?? EventRsvpStatus.PENDING}
                disabled={isSubmitting && isActive}
                onSelect={handleSelect}
              />
            ) : !organizer ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-none px-2.5 py-1 text-xs font-semibold",
                    event.rsvpStatus === EventRsvpStatus.GOING &&
                      "bg-(--success-light) text-(--success-dark)",
                    event.rsvpStatus === EventRsvpStatus.MAYBE &&
                      "bg-(--warning-light) text-(--warning-dark)",
                    event.rsvpStatus === EventRsvpStatus.NOT_GOING &&
                      "bg-(--danger-light) text-(--danger-dark)",
                    (!event.rsvpStatus || event.rsvpStatus === EventRsvpStatus.PENDING) &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {statusLabel}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  Modifier
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="shadow-sm" disabled={isSubmitting && isActive}>
                <Link href={`/event/${event.slug ?? event.id}`}>
                  Accéder à l’événement
                  <MoveRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              {isSubmitting && isActive && (
                <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sauvegarde…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RsvpChoices({
  value,
  onSelect,
  disabled,
}: {
  value: EventRsvpStatus;
  onSelect: (status: EventRsvpStatus) => void;
  disabled?: boolean;
}) {
  const choices: { value: EventRsvpStatus; label: string }[] = [
    { value: EventRsvpStatus.GOING, label: "Je viens" },
    { value: EventRsvpStatus.MAYBE, label: "Peut-être" },
    { value: EventRsvpStatus.NOT_GOING, label: "Je ne viens pas" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {choices.map((choice) => {
          const isSelected = choice.value === value;

          const selectedClass =
            choice.value === EventRsvpStatus.GOING
              ? "border-[var(--success-base)] bg-[var(--success-base)] text-white hover:bg-[var(--success-dark)] hover:text-white"
              : choice.value === EventRsvpStatus.MAYBE
                ? "border-[var(--warning-base)] bg-[var(--warning-base)] text-white hover:bg-[var(--warning-dark)] hover:text-white"
                : "border-[var(--danger-base)] bg-[var(--danger-base)] text-white hover:bg-[var(--danger-dark)] hover:text-white";

          return (
            <Button
              key={choice.value}
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled}
              className={cn(
                "h-11 w-full justify-center rounded-full text-sm font-semibold",
                "whitespace-nowrap", // prevents weird wrapping
                "bg-background", // default background
                isSelected && "border-transparent", // avoid double borders
                isSelected && selectedClass,
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(choice.value);
              }}
            >
              {choice.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({ event, muted = false }: { event: EventSummary; muted?: boolean }) {
  const roleLabel = isOrganizer(event) ? "Organisateur" : "Invité";
  const dateText = event.dateLabel ?? "Date à définir";
  const locationText = event.locationLabel ?? event.location;

  return (
    <Link
      href={`/event/${event.slug ?? event.id}`}
      className={cn(
        "group bg-card/80 focus-visible:ring-ring flex items-center gap-4 rounded-2xl border p-3 transition hover:-translate-y-px hover:shadow-sm focus-visible:ring-2",
        muted && "opacity-80",
      )}
    >
      <div className="from-primary/15 via-primary/10 to-primary/20 relative h-14 w-14 overflow-hidden rounded-xl bg-linear-to-br">
        {event.imagePath && (
          <Image
            src={event.imagePath}
            alt={event.title}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{roleLabel}</Badge>
          {event.isSecretSanta && (
            <Badge className="bg-primary/90 text-primary-foreground">Secret Santa</Badge>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">{dateText}</span>
        </div>
        {locationText && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{locationText}</span>
          </div>
        )}
        <p className="text-foreground truncate text-base font-semibold">{event.title}</p>
      </div>

      <ChevronRight
        className="text-muted-foreground h-5 w-5 transition group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
      {children}
    </p>
  );
}

function isOrganizer(event: EventSummary) {
  return event.userRole === "OWNER" || event.userRole === "ADMIN";
}

const STATUS_LABELS: Record<EventRsvpStatus, string> = {
  PENDING: "En attente",
  GOING: "Je viens",
  MAYBE: "Peut-être",
  NOT_GOING: "Je ne viens pas",
};
