import type { OverviewModuleProps } from "@/features/events/overview/types";
import type { GiftsScreenData } from "@/features/gifts/types";
import type { PollsScreenProps } from "@/features/polls/components/PollsScreen";
import type { PotluckModuleProps } from "@/features/potluck/types";
import type { SecretSantaModuleProps } from "@/features/secret-santa/types";
import type { TimelineModuleProps } from "@/features/timeline/types";

export type EventRouteModuleProps = {
  overview?: OverviewModuleProps;
  gifts?: GiftsScreenData;
  secretSanta?: SecretSantaModuleProps;
  potluck?: PotluckModuleProps;
  timeline?: TimelineModuleProps;
  polls?: PollsScreenProps;
  chat?: Record<string, never>;
};
