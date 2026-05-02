import type { EventPollVM } from "@/features/polls/types";
import { EventTimelineMomentKind } from "@prisma/client";

export type ProgrammeLiveMoment = {
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

export type ProgrammeStatus = "empty" | "upcoming" | "current" | "completed";

export type ProgrammeSummary =
  | {
      status: "En cours" | "À venir";
      title: string;
      startsAt: string;
      endsAt: string | null;
      locationName: string | null;
      note: string | null;
      next:
        | {
            title: string;
            startsAt: string;
            endsAt: string | null;
          }
        | null;
    }
  | null;

export type ProgrammeLiveData = {
  currentMoment: ProgrammeLiveMoment | null;
  nextMoment: ProgrammeLiveMoment | null;
  hasPastMoments: boolean;
  programmeStatus: ProgrammeStatus;
};

export type TimelineModuleProps = {
  eventId: string;
  slug: string;
  canEdit: boolean;
  meId: string;
  eventDate: string | null;
  eventTitle: string;
  schedulePoll?: EventPollVM | null;
  moments: ProgrammeLiveMoment[];
  programmeLive?: ProgrammeLiveData;
};

export type TimelineMoment = TimelineModuleProps["moments"][number];

export type MomentSuggestion = {
  title: string;
  kind: EventTimelineMomentKind;
};

export type EditorState = {
  mode: "create" | "edit";
  momentId?: string;
  title: string;
  kind: EventTimelineMomentKind;
  startsAt: string;
  endsAt: string;
  locationName: string;
  locationAddress: string;
  note: string;
};

export type MomentExecutionState = "past" | "current" | "next" | "future";

export type LiveTimelineMoment = TimelineMoment & { state: MomentExecutionState };

export type TimelineDayGroup = {
  day: string;
  label: string;
  items: LiveTimelineMoment[];
  hasCurrent: boolean;
  hasNext: boolean;
};

export type TimelineSummary =
  | {
      mode: "current";
      primary: LiveTimelineMoment;
      secondary: LiveTimelineMoment | null;
    }
  | {
      mode: "next";
      primary: LiveTimelineMoment;
      secondary: null;
    }
  | {
      mode: "done";
    }
  | null;
