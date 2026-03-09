import type { OverviewModuleProps } from "./modules/OverviewModule";
import type { GiftsModuleProps } from "./modules/GiftsModule";
import type { SecretSantaModuleProps } from "./modules/SecretSantaModule";
import type { PotluckModuleProps } from "./modules/PotluckModule";
import type { TimelineModuleProps } from "./modules/TimelineModule";
import type { ExpensesModuleProps } from "./modules/ExpensesModule";
import type { PollsModuleProps } from "./modules/PollsModule";
import type { ChatModuleProps } from "./modules/ChatModule";

export type ModuleProps = {
  overview?: OverviewModuleProps;
  gifts?: GiftsModuleProps;
  secretSanta?: SecretSantaModuleProps;
  potluck?: PotluckModuleProps;
  timeline?: TimelineModuleProps;
  expenses?: ExpensesModuleProps;
  polls?: PollsModuleProps;
  chat?: ChatModuleProps;
};
