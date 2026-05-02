import { TimelineScreen } from "@/features/timeline/components/TimelineScreen";
import type { TimelineModuleProps } from "@/features/timeline/types";
import { DateSetupEntryPoint } from "../../header/DateSetupEntryPoint";

export type { TimelineModuleProps } from "@/features/timeline/types";

export function TimelineModule(props: TimelineModuleProps) {
  return <TimelineScreen {...props} DateSetupEntryPointComponent={DateSetupEntryPoint} />;
}
