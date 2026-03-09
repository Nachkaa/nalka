import React from "react";
import { cn } from "@/lib/utils";
import type { EventTabKey } from "./event-tabs.config";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  tabKey: EventTabKey;
};

/**
 * Lightweight wrapper to tag module content with its tab key.
 * ModuleRenderer toggles visibility using this marker.
 */
export function EventModulePanel({ tabKey, className, children, ...rest }: Props) {
  return (
    <div data-tab-key={tabKey} className={cn("min-w-0", className)} {...rest}>
      {children}
    </div>
  );
}
