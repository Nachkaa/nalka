import { notFound } from "next/navigation";
import {
  EventGiftMode,
  EventPollStatus,
  EventPollType,
  EventRsvpStatus,
} from "@prisma/client";

import {
  buildEventShellNavigation,
  DEFAULT_EVENT_MODULE_ROUTE_KEY,
  type EventModuleRouteKey,
  type EventModuleSnapshot,
  type EventShellNavItem,
} from "@/features/events/shell-navigation";
import type { EventRouteModuleProps } from "@/features/events/route-module-props";
import { buildOverviewModuleProps } from "@/features/events/overview/build-overview-module-props";
import { requireEventForUser } from "@/features/events/permissions";
import { getEventGiftsScreenData } from "@/features/gifts/server/queries/get-event-gifts-screen-data";
import { getEventPotluckData } from "@/features/potluck/server/queries/get-event-potluck-data";
import { getEventPollsVM } from "@/features/polls/server/queries/get-event-polls-vm";
import type { EventPollVM } from "@/features/polls/types";
import { getEventTimelineData } from "@/features/timeline/server/queries/get-event-timeline-data";
import type {
  ProgrammeLiveData,
  ProgrammeLiveMoment,
  ProgrammeSummary,
} from "@/features/timeline/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type EventWithMembership = NonNullable<Awaited<ReturnType<typeof requireEventForUser>>>;

function toEventModuleSnapshots(
  modules: EventWithMembership["modules"],
): EventModuleSnapshot[] {
  return (modules ?? []).map((module) => ({
    key: module.key,
    enabled: module.enabled,
    position: module.position,
    giftsSettings: module.giftsSettings
      ? {
          isNoSpoil: module.giftsSettings.isNoSpoil,
          isAnonReservations: module.giftsSettings.isAnonReservations,
          isSecondHandOk: module.giftsSettings.isSecondHandOk,
          isHandmadeOk: module.giftsSettings.isHandmadeOk,
          budgetCapCents: module.giftsSettings.budgetCapCents,
        }
      : undefined,
  }));
}

function buildParticipants(event: EventWithMembership) {
  return event.memberships.map((membership) => ({
    id: membership.userId ?? membership.id,
    name: membership.user?.name ?? membership.user?.email ?? "Invite",
    email: membership.user?.email ?? null,
    imageUrl: (membership.user as { image?: string } | null | undefined)?.image ?? null,
    rsvpStatus: membership.rsvpStatus,
    role: membership.role,
  }));
}

function buildRsvpSummary(event: EventWithMembership) {
  const rsvpSummary = { going: 0, maybe: 0, notGoing: 0, pending: 0 };
  const rsvpByUserId = new Map(
    event.memberships.map((membership) => [membership.userId, membership.rsvpStatus]),
  );

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

  for (const membership of event.memberships) {
    bump(membership.rsvpStatus);
  }

  for (const relative of event.relatives ?? []) {
    const ownerStatus =
      rsvpByUserId.get(relative.managedProfile?.ownerId ?? relative.createdById) ??
      EventRsvpStatus.PENDING;
    bump(ownerStatus);
  }

  return rsvpSummary;
}

export type EventShellFrame = {
  unauthorized: false;
  meId: string;
  event: EventWithMembership;
  eventId: string;
  eventSlug: string;
  isAdmin: boolean;
  userRole: EventWithMembership["memberships"][number]["role"] | "MEMBER";
  userRsvpStatus: EventRsvpStatus;
  giftMode: EventGiftMode;
  modules: EventModuleSnapshot[];
  navigation: EventShellNavItem[];
  showBudget: boolean;
  participants: ReturnType<typeof buildParticipants>;
  rsvpSummary: ReturnType<typeof buildRsvpSummary>;
  headerEvent: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    eventOn: string | null;
    eventTime: string | null;
    location: string | null;
    colorHex: string;
    giftMode: EventGiftMode;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    budgetCapCents: number | null;
    hasBringSection: boolean;
    rsvpRequired: boolean;
    scheduleMode: EventWithMembership["scheduleMode"];
    locationMode: EventWithMembership["locationMode"];
  };
  giftsSettings: {
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    budgetCapCents: number | null;
  };
  giftsModuleConfigured: boolean;
  secretSantaSettings: {
    budgetCapCents: number | null;
  };
  hasPotluck: boolean;
  timelineModuleEnabled: boolean;
  rsvpRequired: boolean;
  pollsCount: number;
  membersCount: number;
  participantsCount: number;
};

export type EventRouteContext =
  | { unauthorized: true }
  | (EventShellFrame & {
      activeModule: EventModuleRouteKey;
      schedulePollOpen: EventPollVM | null;
      locationPollOpen: EventPollVM | null;
      moduleProps: EventRouteModuleProps;
    });

export async function getEventShellFrame(args: {
  slug: string;
  userId?: string;
}): Promise<{ unauthorized: true } | EventShellFrame> {
  const resolvedUserId = args.userId ?? (await getCurrentUser())?.userId;
  if (!resolvedUserId) {
    return { unauthorized: true };
  }

  const event = await requireEventForUser(args.slug, resolvedUserId);
  if (!event) {
    notFound();
  }

  const modules = (event.modules ?? []).sort((left, right) => left.position - right.position);
  const moduleByKey = new Map(modules.map((module) => [module.key, module]));
  const eventModules = toEventModuleSnapshots(modules);

  const giftsSettings = moduleByKey.get("GIFTS")?.giftsSettings ?? {
    isNoSpoil: true,
    isAnonReservations: true,
    isSecondHandOk: false,
    isHandmadeOk: false,
    budgetCapCents: null as number | null,
  };
  const giftsModuleConfigured = Boolean(moduleByKey.get("GIFTS")?.giftsSettings);
  const secretSantaSettings = moduleByKey.get("SECRET_SANTA")?.secretSantaSettings ?? {
    budgetCapCents: null as number | null,
  };
  const overviewSettings = moduleByKey.get("OVERVIEW")?.overviewSettings ?? {
    rsvpRequired: true,
  };

  const hasPotluck = moduleByKey.get("POTLUCK")?.enabled ?? false;
  const giftsModuleEnabled = moduleByKey.get("GIFTS")?.enabled ?? false;
  const timelineModuleEnabled = moduleByKey.get("TIMELINE")?.enabled ?? false;
  const rsvpRequired = overviewSettings.rsvpRequired ?? true;
  const pollsCount = await prisma.eventPoll.count({ where: { eventId: event.id } });

  const userMembership = event.memberships.find(
    (membership) => membership.userId === resolvedUserId,
  );
  const isAdmin = userMembership?.role === "ADMIN" || userMembership?.role === "OWNER";
  const userRole = userMembership?.role ?? "MEMBER";
  const userRsvpStatus = userMembership?.rsvpStatus ?? EventRsvpStatus.PENDING;
  const participants = buildParticipants(event);
  const rsvpSummary = buildRsvpSummary(event);

  const navigation = buildEventShellNavigation({
    eventOn: event.eventOn,
    pollsCount,
    userRole,
    modules: eventModules,
  });

  const showBudget =
    giftsModuleEnabled &&
    giftsModuleConfigured &&
    event.giftMode !== EventGiftMode.HOST_LIST &&
    typeof giftsSettings.budgetCapCents === "number";

  return {
    unauthorized: false,
    meId: resolvedUserId,
    event,
    eventId: event.id,
    eventSlug: args.slug,
    isAdmin,
    userRole,
    userRsvpStatus,
    giftMode: event.giftMode,
    modules: eventModules,
    navigation,
    showBudget,
    participants,
    rsvpSummary,
    headerEvent: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      eventOn: event.eventOn ? event.eventOn.toISOString() : null,
      eventTime: event.eventTime,
      location: event.location,
      colorHex: event.colorHex ?? "#F59E0B",
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
    },
    giftsSettings,
    giftsModuleConfigured,
    secretSantaSettings,
    hasPotluck,
    timelineModuleEnabled,
    rsvpRequired,
    pollsCount,
    membersCount: event.memberships.length,
    participantsCount: event.memberships.length + (event.relatives?.length ?? 0),
  };
}

export async function getEventRouteContext(args: {
  slug: string;
  activeModule: EventModuleRouteKey;
  userId?: string;
}): Promise<EventRouteContext> {
  const frame = await getEventShellFrame({ slug: args.slug, userId: args.userId });
  if (frame.unauthorized) {
    return frame;
  }

  const enabledKeys = frame.navigation.map((item) => item.key);
  const activeModule = enabledKeys.includes(args.activeModule)
    ? args.activeModule
    : DEFAULT_EVENT_MODULE_ROUTE_KEY;

  const giftsData = await getEventGiftsScreenData({
    eventId: frame.event.id,
    slug: frame.event.slug,
    currentUserId: frame.meId,
    eventOwnerId: frame.event.ownerId,
    giftMode: frame.event.giftMode,
    isConfigured: frame.giftsModuleConfigured,
    isNoSpoil: frame.giftsSettings.isNoSpoil,
    isAnonReservations: frame.giftsSettings.isAnonReservations,
    isAdmin: frame.isAdmin,
    giftsModuleEnabled: frame.modules.some((module) => module.key === "GIFTS" && module.enabled),
    includeScreenData: activeModule === "gifts" && enabledKeys.includes("gifts"),
  });

  let potluckStats: { totalItems: number; myClaims: number } | null = null;
  if (frame.hasPotluck) {
    const [totalItems, myClaims] = await Promise.all([
      prisma.eventBringItem.count({ where: { eventId: frame.event.id } }),
      prisma.eventBringParticipation.count({
        where: { userId: frame.meId, item: { eventId: frame.event.id } },
      }),
    ]);

    potluckStats = { totalItems, myClaims };
  }

  let timelineMoments: ProgrammeLiveMoment[] = [];
  let programmeLive: ProgrammeLiveData = {
    currentMoment: null,
    nextMoment: null,
    hasPastMoments: false,
    programmeStatus: "empty",
  };
  let programmeSummary: ProgrammeSummary = null;

  if (frame.timelineModuleEnabled) {
    const timelineData = await getEventTimelineData(frame.event.id);
    timelineMoments = timelineData.moments;
    programmeLive = timelineData.programmeLive;
    programmeSummary = timelineData.programmeSummary;
  }

  const pollsVmPromise =
    frame.pollsCount > 0
      ? getEventPollsVM(frame.event.id, frame.meId)
      : Promise.resolve([] as EventPollVM[]);
  const loadPollsVm = () => pollsVmPromise;

  let canonicalPolls: EventPollVM[] = [];
  let schedulePollOpen: EventPollVM | null = null;
  let locationPollOpen: EventPollVM | null = null;

  const moduleProps: EventRouteModuleProps = {
    overview: buildOverviewModuleProps({
      event: frame.event,
      slug: args.slug,
      rsvpSummary: frame.rsvpSummary,
      participantsCount: frame.participantsCount,
      isAdmin: frame.isAdmin,
      navigation: frame.navigation,
      rsvpRequired: frame.rsvpRequired,
      userRsvpStatus: frame.userRsvpStatus,
      userRole: frame.userRole,
      giftsStats: giftsData.giftsStats,
      potluckStats,
      programmeSummary,
      programmeLive,
      membersCount: frame.membersCount,
      meId: frame.meId,
    }),
  };

  if (frame.pollsCount > 0) {
    canonicalPolls = (await loadPollsVm()).filter(
      (poll) =>
        (poll.type === EventPollType.SCHEDULE || poll.type === EventPollType.LOCATION) &&
        poll.status === EventPollStatus.OPEN &&
        poll.isActive,
    );

    if (canonicalPolls.length > 0) {
      moduleProps.overview = buildOverviewModuleProps({
        event: frame.event,
        slug: args.slug,
        rsvpSummary: frame.rsvpSummary,
        participantsCount: frame.participantsCount,
        isAdmin: frame.isAdmin,
        navigation: frame.navigation,
        rsvpRequired: frame.rsvpRequired,
        userRsvpStatus: frame.userRsvpStatus,
        userRole: frame.userRole,
        giftsStats: giftsData.giftsStats,
        potluckStats,
        programmeSummary,
        programmeLive,
        canonicalPolls,
        membersCount: frame.membersCount,
        meId: frame.meId,
      });
    }

    schedulePollOpen =
      canonicalPolls.find(
        (poll) =>
          poll.type === EventPollType.SCHEDULE &&
          poll.status === EventPollStatus.OPEN &&
          poll.isActive,
      ) ?? null;

    locationPollOpen =
      canonicalPolls.find(
        (poll) =>
          poll.type === EventPollType.LOCATION &&
          poll.status === EventPollStatus.OPEN &&
          poll.isActive,
      ) ?? null;
  }

  if (activeModule === "gifts" && enabledKeys.includes("gifts")) {
    moduleProps.gifts = giftsData.screenData ?? undefined;
  }

  if (activeModule === "secret-santa" && enabledKeys.includes("secret-santa")) {
    moduleProps.secretSanta = {
      eventId: frame.event.id,
      slug: frame.event.slug,
      isAdmin: frame.isAdmin,
      membersCount: frame.event.memberships.length,
      budgetCapCents: frame.secretSantaSettings.budgetCapCents,
      isSecondHandOk: frame.giftsSettings.isSecondHandOk,
      isHandmadeOk: frame.giftsSettings.isHandmadeOk,
    };
  }

  if (activeModule === "potluck" && enabledKeys.includes("potluck")) {
    const potluckData = await getEventPotluckData(frame.event.id, frame.meId);

    moduleProps.potluck = {
      eventId: frame.event.id,
      slug: frame.event.slug,
      currentUserId: frame.meId,
      userRole: potluckData.userRole,
      items: potluckData.items,
      members: potluckData.members,
    };
  }

  if (activeModule === "timeline" && enabledKeys.includes("timeline")) {
    moduleProps.timeline = {
      eventId: frame.event.id,
      slug: frame.event.slug,
      canEdit: frame.isAdmin,
      meId: frame.meId,
      eventDate: frame.event.eventOn ? frame.event.eventOn.toISOString() : null,
      eventTitle: frame.event.title,
      schedulePoll: schedulePollOpen,
      moments: timelineMoments,
      programmeLive,
    };
  }

  if (activeModule === "polls" && enabledKeys.includes("polls")) {
    const polls = await loadPollsVm();
    moduleProps.polls = {
      polls,
      slug: args.slug,
      canEdit: frame.isAdmin,
      totalMembers: frame.membersCount,
      meId: frame.meId,
    };
  }

  if (activeModule === "chat" && enabledKeys.includes("chat")) {
    moduleProps.chat = {};
  }

  return {
    ...frame,
    activeModule,
    schedulePollOpen,
    locationPollOpen,
    moduleProps,
  };
}
