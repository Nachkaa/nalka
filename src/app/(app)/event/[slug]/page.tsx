// app/(app)/event/[slug]/page.tsx

import { auth } from "@/auth";
import { Container } from "@/components/layout/Container";
import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { getEventPollsVM } from "@/domain/polls/getEventPollsVM";
import { requireEventForUser } from "@/features/events/permissions";
import { prisma } from "@/lib/prisma";
import {
  EventGiftMode as EGM,
  EventMemberRole as ER,
  EventModuleKey,
  EventPollStatus,
  EventPollType,
  EventRsvpStatus,
  ReservationStatus,
} from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import type { GiftListWithParticipantAndItems } from "./gifts/_components/types";
import { EventHeader } from "./_components/header";
import { EventShellClient } from "./_components/tabs/EventShellClient";
import { ModuleRenderer } from "./_components/tabs/ModuleRenderer";
import {
  buildEventTabs,
  DEFAULT_TAB_KEY,
  EventTabKey,
  normalizeTabKey,
} from "./_components/tabs/event-tabs.config";
import type { ModuleProps } from "./_components/tabs/module-props";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug?: string };
  searchParams?: { tab?: string | string[] };
};

const ROLE = ER;
const MODE = EGM;

export default async function EventPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const sp = (await searchParams) ?? {};

  const session = await auth();
  if (!session?.user) return <main className="p-6">Non autorisé</main>;

  const meId =
    session.user.id ??
    (
      await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
    )?.id;
  if (!meId) return <main className="p-6">Non autorisé</main>;

  const event = await requireEventForUser(slug, meId);
  if (!event) notFound();

  const modules = (event.modules ?? []).sort((a, b) => a.position - b.position);
  const moduleByKey = new Map(modules.map((m) => [m.key, m]));

  const defaultGiftSettings = {
    isNoSpoil: true,
    isAnonReservations: true,
    isSecondHandOk: false,
    isHandmadeOk: false,
    budgetCapCents: null as number | null,
  };

  const giftsSettings = moduleByKey.get(EventModuleKey.GIFTS)?.giftsSettings ?? defaultGiftSettings;
  const secretSantaSettings = moduleByKey.get(EventModuleKey.SECRET_SANTA)?.secretSantaSettings ?? {
    budgetCapCents: null as number | null,
  };
  const overviewSettings = moduleByKey.get(EventModuleKey.OVERVIEW)?.overviewSettings ?? {
    rsvpRequired: true,
  };

  const hasPotluck = moduleByKey.get(EventModuleKey.POTLUCK)?.enabled ?? false;
  const giftsModuleEnabled = moduleByKey.get(EventModuleKey.GIFTS)?.enabled ?? false;
  const rsvpRequired = overviewSettings.rsvpRequired ?? true;

  const pollsCount = await prisma.eventPoll.count({ where: { eventId: event.id } });
  const hasGifts = giftsModuleEnabled;

  const isAdmin = event.memberships.some(
    (m) => m.userId === meId && (m.role === ROLE.ADMIN || m.role === ROLE.OWNER),
  );

  const userMembership = event.memberships.find((m) => m.userId === meId);
  const userRole = userMembership?.role || "MEMBER";
  const userRsvpStatus = userMembership?.rsvpStatus ?? EventRsvpStatus.PENDING;

  const participants = event.memberships.map((m) => ({
    id: m.userId ?? m.id,
    name: m.user?.name ?? m.user?.email ?? "Invité",
    email: m.user?.email ?? null,
    imageUrl: (m.user as { image?: string } | null | undefined)?.image ?? null,
    rsvpStatus: m.rsvpStatus,
    role: m.role,
  }));

  const rsvpSummary = { going: 0, maybe: 0, notGoing: 0, pending: 0 };
  const rsvpByUserId = new Map(event.memberships.map((m) => [m.userId, m.rsvpStatus]));

  const bump = (status: EventRsvpStatus) => {
    switch (status) {
      case EventRsvpStatus.GOING:
        rsvpSummary.going += 1;
        break;
      case EventRsvpStatus.MAYBE:
        rsvpSummary.maybe += 1;
        break;
      case EventRsvpStatus.NOT_GOING:
        rsvpSummary.notGoing += 1;
        break;
      default:
        rsvpSummary.pending += 1;
        break;
    }
  };

  for (const m of event.memberships) {
    bump(m.rsvpStatus);
  }

  for (const rel of event.relatives ?? []) {
    const ownerStatus =
      rsvpByUserId.get(rel.managedProfile?.ownerId ?? rel.createdById) ?? EventRsvpStatus.PENDING;
    bump(ownerStatus);
  }

  const headerEvent = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    eventOn: event.eventOn ? event.eventOn.toISOString() : null,
    eventTime: event.eventTime,
    location: event.location,
    colorHex: event.colorHex,

    giftMode: event.giftMode,
    isNoSpoil: giftsSettings.isNoSpoil,
    isAnonReservations: giftsSettings.isAnonReservations,
    isSecondHandOk: giftsSettings.isSecondHandOk,
    isHandmadeOk: giftsSettings.isHandmadeOk,
    budgetCapCents: giftsSettings.budgetCapCents,

    hasBringSection: hasPotluck,
    rsvpRequired,
    scheduleMode: event.scheduleMode,
    locationMode: event.locationMode,
  } satisfies Parameters<typeof EventHeader>[0]["event"];

  const showBudget =
    hasGifts &&
    event.giftMode !== MODE.HOST_LIST &&
    typeof giftsSettings.budgetCapCents === "number";

  const requestedTabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const requestedTab = normalizeTabKey(requestedTabParam);

  const tabs = buildEventTabs({
    scheduleMode: event.scheduleMode,
    locationMode: event.locationMode,
    eventOn: event.eventOn,
    pollsCount,
    userRole,
    modules: modules.map((m) => ({
      key: m.key,
      enabled: m.enabled,
      position: m.position,
      giftsSettings: m.giftsSettings
        ? {
            isNoSpoil: m.giftsSettings.isNoSpoil,
            isAnonReservations: m.giftsSettings.isAnonReservations,
            isSecondHandOk: m.giftsSettings.isSecondHandOk,
            isHandmadeOk: m.giftsSettings.isHandmadeOk,
            budgetCapCents: m.giftsSettings.budgetCapCents,
          }
        : undefined,
    })),
  });
  const enabledTabs = tabs.filter((t) => t.enabled || t.key === DEFAULT_TAB_KEY);
  const enabledKeys = enabledTabs.map((t) => t.key);
  const activeTab: EventTabKey =
    requestedTab && enabledKeys.includes(requestedTab) ? requestedTab : DEFAULT_TAB_KEY;

  if (requestedTabParam && (!requestedTab || !enabledKeys.includes(requestedTab))) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams ?? {})) {
      if (k === "tab") continue;
      if (Array.isArray(v)) {
        v.forEach((val) => params.append(k, val));
      } else if (typeof v === "string") {
        params.set(k, v);
      }
    }
    if (activeTab !== DEFAULT_TAB_KEY) params.set("tab", activeTab);
    const url = params.toString() ? `/event/${slug}?${params.toString()}` : `/event/${slug}`;
    redirect(url);
  }

  const membersCount = event.memberships.length;
  const participantsCount = event.memberships.length + (event.relatives?.length ?? 0);

  let giftStats: {
    myItemsCount: number;
    otherItemsCount: number;
    myReservationsCount: number;
  } | null = null;
  if (giftsModuleEnabled) {
    const [myItemsCount, otherItemsCount, myReservationsCount] = await Promise.all([
      prisma.giftItem.count({
        where: {
          list: {
            eventId: event.id,
            ownerId: meId,
          },
        },
      }),
      prisma.giftItem.count({
        where: {
          list: {
            eventId: event.id,
            ownerId: { not: meId },
          },
        },
      }),
      prisma.reservation.count({
        where: {
          byUserId: meId,
          status: { not: ReservationStatus.RELEASED },
          item: {
            list: {
              eventId: event.id,
            },
          },
        },
      }),
    ]);

    giftStats = { myItemsCount, otherItemsCount, myReservationsCount };
  }

  let giftLists: GiftListWithParticipantAndItems[] = [];
  let hostList: GiftListWithParticipantAndItems | null = null;
  let myList: GiftListWithParticipantAndItems | null = null;
  let otherLists: GiftListWithParticipantAndItems[] = [];
  if (giftsModuleEnabled || activeTab === "gifts") {
    giftLists = (await prisma.giftList.findMany({
      where: { eventId: event.id },
      include: {
        owner: true,
        eventRelative: true,
        items: {
          include: {
            reservations: {
              where: { status: { not: ReservationStatus.RELEASED } },
              include: { byUser: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })) as GiftListWithParticipantAndItems[];

    hostList =
      giftLists.find((l) => l.ownerId === event.ownerId && l.eventRelativeId === null) ?? null;
    myList = giftLists.find((l) => l.ownerId === meId && l.eventRelativeId === null) ?? null;

    if (event.giftMode === MODE.HOST_LIST && hostList) {
      otherLists = meId === event.ownerId ? [] : [hostList];
    } else {
      otherLists = giftLists.filter((l) => !(l.ownerId === meId && l.eventRelativeId === null));
    }
  }

  let potluckStats: { totalItems: number; myClaims: number } | null = null;
  if (hasPotluck) {
    const [totalItems, myClaims] = await Promise.all([
      prisma.eventBringItem.count({ where: { eventId: event.id } }),
      prisma.eventBringParticipation.count({
        where: { userId: meId, item: { eventId: event.id } },
      }),
    ]);

    potluckStats = { totalItems, myClaims };
  }

  const pollsVmPromise =
    pollsCount > 0 ? getEventPollsVM(event.id, meId) : Promise.resolve([] as EventPollVM[]);
  let canonicalPolls: EventPollVM[] = [];
  let schedulePollOpen: EventPollVM | null = null;
  let locationPollOpen: EventPollVM | null = null;

  const loadPollsVm = () => pollsVmPromise;

  // Module-specific data fetched only for active tab (strategy A)
  const moduleProps: ModuleProps = {
    overview: {
      eventTitle: event.title,
      eventDate: event.eventOn ? event.eventOn.toISOString() : null,
      location: event.location,
      rsvpSummary,
      participantsCount,
      eventId: event.id,
      showLeaveSection: !isAdmin,
      eventSlug: slug,
      description: event.description,
      canEditDescription: isAdmin,
      tabs: enabledTabs,
      rsvpRequired,
      myRsvpStatus: userRsvpStatus,
      canEditEvent: isAdmin,
      userRole,
      scheduleMode: event.scheduleMode,
      locationMode: event.locationMode,
      giftMode: event.giftMode,
      giftsStats: giftStats ?? undefined,
      potluckStats: potluckStats ?? undefined,
    },
  };

  const giftSectionProps = {
    eventId: event.id,
    slug: event.slug,
    giftMode: event.giftMode,
    isNoSpoil: giftsSettings.isNoSpoil,
    isAnonReservations: giftsSettings.isAnonReservations,
    currentUserId: meId,
    isEventOwner: event.ownerId === meId,
    isAdmin,
    hostList,
    myList,
    otherLists,
  };

  if (pollsCount > 0) {
    canonicalPolls = (await loadPollsVm()).filter(
      (poll) =>
        (poll.type === EventPollType.SCHEDULE || poll.type === EventPollType.LOCATION) &&
        poll.status === EventPollStatus.OPEN &&
        poll.isActive,
    );

    if (canonicalPolls.length > 0) {
      if (moduleProps.overview) {
        moduleProps.overview.pollsProps = {
          polls: canonicalPolls,
          totalMembers: membersCount,
          canEdit: isAdmin,
          meId,
        };
      }
    }

    schedulePollOpen =
      canonicalPolls.find(
        (poll) =>
          poll.type === EventPollType.SCHEDULE && poll.status === EventPollStatus.OPEN && poll.isActive,
      ) ?? null;

    locationPollOpen =
      canonicalPolls.find(
        (poll) =>
          poll.type === EventPollType.LOCATION && poll.status === EventPollStatus.OPEN && poll.isActive,
      ) ?? null;
  }

  if (activeTab === "gifts" && enabledKeys.includes("gifts")) {
    moduleProps.gifts = { ...giftSectionProps };
  }

  if (activeTab === "secret-santa" && enabledKeys.includes("secret-santa")) {
    moduleProps.secretSanta = {
      eventId: event.id,
      slug: event.slug,
      isAdmin,
      membersCount: event.memberships.length,
      budgetCapCents: secretSantaSettings.budgetCapCents,
      isSecondHandOk: giftsSettings.isSecondHandOk,
      isHandmadeOk: giftsSettings.isHandmadeOk,
    };
  }

  if (activeTab === "potluck" && enabledKeys.includes("potluck")) {
    const [items, members] = await Promise.all([
      prisma.eventBringItem.findMany({
        where: { eventId: event.id },
        include: {
          bringers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.eventMember.findMany({
        where: { eventId: event.id },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    moduleProps.potluck = {
      eventId: event.id,
      slug: event.slug,
      currentUserId: meId,
      userRole,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        note: item.note,
        category: item.category!,
        createdById: item.createdById,
        bringers: item.bringers.map((b) => ({
          id: b.id,
          userId: b.userId!,
          user: b.user
            ? {
                name: b.user.name,
                email: b.user.email,
              }
            : null,
        })),
      })),
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: m.user
          ? {
              name: m.user.name,
              email: m.user.email,
            }
          : null,
      })),
    };
  }

  if (activeTab === "timeline" && enabledKeys.includes("timeline")) {
    moduleProps.timeline = {
      eventOn: event.eventOn ? event.eventOn.toISOString() : null,
      eventTime: event.eventTime,
      location: event.location,
      scheduleMode: event.scheduleMode,
      locationMode: event.locationMode,
    };
  }

  if (activeTab === "expenses" && enabledKeys.includes("expenses")) {
    moduleProps.expenses = {};
  }

  if (activeTab === "polls" && enabledKeys.includes("polls")) {
    const polls = await loadPollsVm();
    moduleProps.polls = {
      polls,
      slug,
      canEdit: isAdmin,
      totalMembers: membersCount,
      meId,
    };
  }

  if (activeTab === "chat" && enabledKeys.includes("chat")) {
    moduleProps.chat = {};
  }

  const moduleNode = <ModuleRenderer activeTab={activeTab} moduleProps={moduleProps} />;

  return (
    <div className="">
      <Container className="space-y-0">
        <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
          <Container className="py-3">
            <EventHeader
              event={headerEvent}
              slug={slug}
              schedulePollOpen={schedulePollOpen}
              locationPollOpen={locationPollOpen}
              meId={meId}
              isAdmin={isAdmin}
              canEditEvent={isAdmin}
              canEditEventMeta={isAdmin}
              showBudget={showBudget}
              participants={participants}
              rsvpSummary={rsvpSummary}
            />
          </Container>
        </div>

        <EventShellClient
          tabs={enabledTabs}
          activeTab={activeTab}
          modules={modules.map((m) => ({
            key: m.key,
            enabled: m.enabled,
            position: m.position,
            giftsSettings: m.giftsSettings
              ? {
                  isNoSpoil: m.giftsSettings.isNoSpoil,
                  isAnonReservations: m.giftsSettings.isAnonReservations,
                  isSecondHandOk: m.giftsSettings.isSecondHandOk,
                  isHandmadeOk: m.giftsSettings.isHandmadeOk,
                  budgetCapCents: m.giftsSettings.budgetCapCents,
                }
              : undefined,
          }))}
          eventId={event.id}
          eventSlug={slug}
          canManageModules={isAdmin}
          giftMode={event.giftMode}
        >
          {moduleNode}
        </EventShellClient>
      </Container>
    </div>
  );
}
