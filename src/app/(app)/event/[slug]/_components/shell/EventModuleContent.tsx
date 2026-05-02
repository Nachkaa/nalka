import { GiftsScreen } from "@/features/gifts/components/GiftsScreen";
import { PollsScreen } from "@/features/polls/components/PollsScreen";
import type { EventRouteModuleProps } from "@/features/events/route-module-props";
import type { EventModuleRouteKey } from "@/features/events/shell-navigation";

import { ChatModule } from "./modules/ChatModule";
import { OverviewModule } from "./modules/OverviewModule";
import { PotluckModule } from "./modules/PotluckModule";
import { SecretSantaModule } from "./modules/SecretSantaModule";
import { TimelineModule } from "./modules/TimelineModule";

type Props = {
  activeModule: EventModuleRouteKey;
  moduleProps: EventRouteModuleProps;
};

function renderOverview(moduleProps: EventRouteModuleProps) {
  if (!moduleProps.overview) {
    return null;
  }

  return <OverviewModule {...moduleProps.overview} />;
}

export function EventModuleContent({ activeModule, moduleProps }: Props) {
  switch (activeModule) {
    case "gifts":
      return moduleProps.gifts ? <GiftsScreen {...moduleProps.gifts} /> : renderOverview(moduleProps);

    case "secret-santa":
      return moduleProps.secretSanta ? (
        <SecretSantaModule {...moduleProps.secretSanta} />
      ) : (
        renderOverview(moduleProps)
      );

    case "potluck":
      return moduleProps.potluck ? <PotluckModule {...moduleProps.potluck} /> : renderOverview(moduleProps);

    case "timeline":
      return moduleProps.timeline ? (
        <TimelineModule {...moduleProps.timeline} />
      ) : (
        renderOverview(moduleProps)
      );

    case "polls":
      return moduleProps.polls ? <PollsScreen {...moduleProps.polls} /> : renderOverview(moduleProps);

    case "chat":
      return <ChatModule />;

    case "budget":
    case "overview":
    default:
      return renderOverview(moduleProps);
  }
}
