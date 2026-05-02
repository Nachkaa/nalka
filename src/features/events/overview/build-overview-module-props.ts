import type { EventPollVM } from "@/features/polls/types";

import type {
  GiftsStats,
  OverviewModuleProps,
  PotluckStats,
  ProgrammeLiveData,
  ProgrammeSummary,
} from "./types";

type BuildOverviewModulePropsArgs = {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    eventOn: Date | null;
    location: string | null;
    scheduleMode: OverviewModuleProps["scheduleMode"];
    locationMode: OverviewModuleProps["locationMode"];
    giftMode: OverviewModuleProps["giftMode"];
  };
  slug: string;
  rsvpSummary: OverviewModuleProps["rsvpSummary"];
  participantsCount: number;
  isAdmin: boolean;
  navigation: OverviewModuleProps["navigation"];
  rsvpRequired: boolean;
  userRsvpStatus: OverviewModuleProps["myRsvpStatus"];
  userRole: OverviewModuleProps["userRole"];
  giftsStats?: GiftsStats | null;
  potluckStats?: PotluckStats | null;
  programmeSummary?: ProgrammeSummary | null;
  programmeLive?: ProgrammeLiveData;
  canonicalPolls?: EventPollVM[];
  membersCount: number;
  meId: string;
};

export function buildOverviewModuleProps({
  event,
  slug,
  rsvpSummary,
  participantsCount,
  isAdmin,
  navigation,
  rsvpRequired,
  userRsvpStatus,
  userRole,
  giftsStats,
  potluckStats,
  programmeSummary,
  programmeLive,
  canonicalPolls = [],
  membersCount,
  meId,
}: BuildOverviewModulePropsArgs): OverviewModuleProps {
  return {
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
    navigation,
    rsvpRequired,
    myRsvpStatus: userRsvpStatus,
    canEditEvent: isAdmin,
    userRole,
    scheduleMode: event.scheduleMode,
    locationMode: event.locationMode,
    giftMode: event.giftMode,
    giftsStats: giftsStats ?? undefined,
    potluckStats: potluckStats ?? undefined,
    programmeSummary: programmeSummary ?? undefined,
    programmeLive,
    pollsProps:
      canonicalPolls.length > 0
        ? {
            polls: canonicalPolls,
            totalMembers: membersCount,
            canEdit: isAdmin,
            meId,
          }
        : undefined,
  };
}
