"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import {
  EventGiftMode,
  EventLocationMode,
  EventMemberRole,
  EventPollStatus,
  EventRsvpStatus,
  EventScheduleMode,
  EventTimelineMomentKind,
} from "@prisma/client";
import {
  BarChart3,
  CalendarClock,
  Gift,
  Home,
  MessageSquare,
  PiggyBank,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { enableRsvpRequirement } from "../../../actions/rsvp";
import { PollCard } from "../../../_components/poll/PollCard";
import { EventDescriptionSection } from "../../EventDescriptionSection";
import LeaveEventDialog from "../../LeaveEventDialog";
import { RsvpBar } from "../../header/RsvpBar";
import { WhatsNextSection } from "../../whats-next";
import type { EventTabDefinition, EventTabKey } from "../event-tabs.config";

type RsvpSummary = {
  going: number;
  maybe: number;
  notGoing: number;
  pending: number;
};

type OverviewPollsProps = {
  polls: EventPollVM[];
  totalMembers: number;
  canEdit: boolean;
  meId: string;
};

type GiftsStats = {
  myItemsCount: number;
  otherItemsCount: number;
  myReservationsCount: number;
};

type PotluckStats = {
  totalItems: number;
  myClaims: number;
};

type ProgrammeSummary = {
  status: "En cours" | "À venir";
  title: string;
  startsAt: string;
  endsAt: string | null;
  locationName?: string | null;
  note?: string | null;
  next?:
    | {
        title: string;
        startsAt: string;
        endsAt: string | null;
      }
    | null;
};

type ProgrammeLiveMoment = {
  id: string;
  title: string;
  kind: EventTimelineMomentKind;
  startsAt: string;
  endsAt: string | null;
  locationName: string | null;
  locationAddress: string | null;
  note: string | null;
  position: number;
};

type ProgrammeLiveData = {
  currentMoment: ProgrammeLiveMoment | null;
  nextMoment: ProgrammeLiveMoment | null;
  hasPastMoments: boolean;
  programmeStatus: "empty" | "upcoming" | "current" | "completed";
};

export type OverviewModuleProps = {
  eventTitle: string;
  eventDate: string | null;
  location: string | null;
  rsvpSummary: RsvpSummary;
  participantsCount: number;
  pollsProps?: OverviewPollsProps;
  eventId: string;
  showLeaveSection: boolean;
  eventSlug: string;
  description: string | null;
  canEditDescription: boolean;
  tabs: EventTabDefinition[];
  rsvpRequired: boolean;
  myRsvpStatus: EventRsvpStatus;
  canEditEvent: boolean;
  userRole: EventMemberRole;
  scheduleMode: EventScheduleMode;
  locationMode: EventLocationMode;
  giftMode: EventGiftMode;
  giftsStats?: GiftsStats;
  potluckStats?: PotluckStats;
  programmeSummary?: ProgrammeSummary | null;
  programmeLive?: ProgrammeLiveData;
};

const isAdminRole = (role: EventMemberRole) => role === "ADMIN" || role === "OWNER";

export function OverviewModule({  eventDate,
  location,
  pollsProps,
  eventId,
  showLeaveSection,
  eventSlug,
  description,
  canEditDescription,
  tabs,
  rsvpRequired,
  myRsvpStatus,
  canEditEvent,
  userRole,
  scheduleMode,
  locationMode,
  giftMode,
  giftsStats,
  potluckStats,
  programmeSummary,
}: OverviewModuleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userStatus, setUserStatus] = useState<EventRsvpStatus>(myRsvpStatus);
  const [enableRsvpPending, startEnableRsvp] = useTransition();
  const shouldShowRsvp = rsvpRequired && !isAdminRole(userRole);
  const showEnableRsvp = canEditEvent && !rsvpRequired;

  const setTab = (key: EventTabKey) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const defaultTab: EventTabKey = "overview";
    if (key === defaultTab) {
      params.delete("tab");
    } else {
      params.set("tab", key);
    }
    const url = params.size ? `${pathname}?${params.toString()}` : pathname;
    router.push(url, { scroll: false });
  };

  const moduleCards = useMemo<EventTabDefinition[]>(
    () => tabs.filter((t) => t.key !== "overview"),
    [tabs],
  );

  const POLL_ORDER: Record<string, number> = {
    SCHEDULE: 0,
    LOCATION: 1,
  };

  const orderedPolls = (pollsProps?.polls ?? [])
    .filter((p) => p.status === EventPollStatus.OPEN && p.isActive)
    .slice()
    .sort((a, b) => {
      const ao = POLL_ORDER[a.type] ?? 99;
      const bo = POLL_ORDER[b.type] ?? 99;
      return ao - bo;
    });

  const hasPolls = orderedPolls.length > 0;

  const enabledModules = useMemo(() => {
    const keys = new Set(tabs.filter((t) => t.enabled).map((t) => t.key));
    return {
      gifts: keys.has("gifts"),
      potluck: keys.has("potluck"),
      expenses: keys.has("expenses"),
    };
  }, [tabs]);

  const renderIcon = (key: EventTabKey) => {
    switch (key) {
      case "overview":
        return <Home className="h-4 w-4" aria-hidden />;
      case "gifts":
        return <Gift className="h-4 w-4" aria-hidden />;
      case "secret-santa":
        return <Sparkles className="h-4 w-4" aria-hidden />;
      case "potluck":
        return <UtensilsCrossed className="h-4 w-4" aria-hidden />;
      case "timeline":
        return <CalendarClock className="h-4 w-4" aria-hidden />;
      case "expenses":
        return <PiggyBank className="h-4 w-4" aria-hidden />;
      case "polls":
        return <BarChart3 className="h-4 w-4" aria-hidden />;
      case "chat":
        return <MessageSquare className="h-4 w-4" aria-hidden />;
      default:
        return null;
    }
  };

  const formatProgrammeTimeRange = (startsAt: string, endsAt: string | null) =>
    `${new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt))}${
      endsAt
        ? ` · ${new Intl.DateTimeFormat("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(endsAt))}`
        : ""
    }`;

  return (
    <div className="space-y-6">
      {shouldShowRsvp ? (
        <section>
          <RsvpBar
            eventId={eventId}
            initialStatus={myRsvpStatus}
            status={userStatus}
            onStatusChange={setUserStatus}
            mode="full"
          />
        </section>
      ) : showEnableRsvp ? (
        <section>
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="h-9 rounded-full px-3 text-sm font-semibold"
            disabled={enableRsvpPending}
            onClick={() =>
              startEnableRsvp(async () => {
                await enableRsvpRequirement({ eventId, slug: eventSlug });
              })
            }
          >
            Activer les RSVP
          </Button>
        </section>
      ) : null}

      <section className="space-y-2">
        <EventDescriptionSection
          eventId={eventId}
          slug={eventSlug}
          description={description}
          canEdit={canEditDescription}
        />
      </section>

      <WhatsNextSection
        input={{
          eventDate,
          location,
          description,
          polls: pollsProps?.polls ?? [],
          role: userRole,
          canEditEvent,
          rsvpRequired,
          myRsvpStatus,
          scheduleMode,
          locationMode,
          modules: enabledModules,
          giftMode,
          giftsStats,
          potluckStats,
        }}
        hideWhenEmpty
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {programmeSummary ? (
          <section className="sm:col-span-2 xl:col-span-2">
            <button
              type="button"
              onClick={() => setTab("timeline")}
              className="flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-(--primary-200) bg-linear-to-br from-(--primary-50) to-white p-4 text-left shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide uppercase text-(--primary-700)">
                    Programme
                  </p>
                  <p className="text-foreground mt-1 text-base font-semibold leading-snug">
                    {programmeSummary.title}
                  </p>
                </div>
                <Badge className="border-0 bg-(--primary-600) text-white" variant="secondary">
                  {programmeSummary.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="text-foreground/90">
                  {formatProgrammeTimeRange(programmeSummary.startsAt, programmeSummary.endsAt)}
                </p>
                {programmeSummary.locationName ? (
                  <p className="text-muted-foreground">{programmeSummary.locationName}</p>
                ) : null}
                {programmeSummary.note ? (
                  <p className="text-muted-foreground line-clamp-2">{programmeSummary.note}</p>
                ) : null}
              </div>

              {programmeSummary.next ? (
                <div className="text-muted-foreground rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-sm">
                  <span className="font-medium">Ensuite :</span>{" "}
                  {programmeSummary.next.title} ·{" "}
                  {formatProgrammeTimeRange(
                    programmeSummary.next.startsAt,
                    programmeSummary.next.endsAt,
                  )}
                </div>
              ) : null}

              <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-(--primary-700)">
                <CalendarClock className="h-4 w-4" aria-hidden />
                <span>Voir le programme</span>
              </div>
            </button>
          </section>
        ) : null}

        {hasPolls ? (
          <section className="space-y-2 sm:col-span-2 xl:col-span-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Sondages en cours
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {orderedPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  slug={eventSlug}
                  canEdit={pollsProps!.canEdit}
                  totalMembers={pollsProps!.totalMembers}
                  meId={pollsProps!.meId}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Modules</p>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {moduleCards.length} modules actifs
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => setTab(module.key)}
              className="border-border bg-card flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="flex w-full items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {renderIcon(module.iconKey)}
                </span>
                <span className="text-foreground font-semibold">{module.label}</span>
                {module.badge !== null && module.badge !== undefined ? (
                  <span className="bg-muted text-foreground ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold">
                    {module.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">{module.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {showLeaveSection ? (
          <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Quitter l’événement
            </p>
            <div className="text-muted-foreground mt-2 flex flex-col gap-2 text-sm">
              <p>Vous pourrez revenir uniquement si l’organisateur vous réinvite.</p>
              <div className="pt-1">
                <LeaveEventDialog eventId={eventId} />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-3 text-xs">
        Astuce : cliquez sur un widget pour ouvrir directement le module correspondant.
      </div>
    </div>
  );
}
