"use client";

import { enableRsvpRequirement } from "../../../actions/rsvp";
import { updateEventDescription } from "../../../edit/actions";
import { leaveEvent } from "../../../leave";
import { updateRsvp } from "../../../actions/rsvp";
import { OverviewScreen } from "@/features/events/overview/components/OverviewScreen";
import type { OverviewModuleProps } from "@/features/events/overview/types";

export type { OverviewModuleProps } from "@/features/events/overview/types";

export function OverviewModule(props: OverviewModuleProps) {
  return (
    <OverviewScreen
      {...props}
      updateRsvpAction={updateRsvp}
      enableRsvpRequirementAction={enableRsvpRequirement}
      updateDescriptionAction={updateEventDescription}
      leaveEventAction={leaveEvent}
    />
  );
}
