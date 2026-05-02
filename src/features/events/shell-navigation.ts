import { EventMemberRole, EventModuleKey } from "@prisma/client";

import {
  EVENT_MODULE_REGISTRY,
  getEventModuleByNavigationKey,
  type EventModuleNavigationKey,
} from "@/features/events/module-registry";

export const DEFAULT_EVENT_MODULE_ROUTE_KEY = "overview" as const;

export const ALL_EVENT_MODULE_ROUTE_KEYS = EVENT_MODULE_REGISTRY.map(
  (definition) => definition.navigationKey,
) as EventModuleNavigationKey[];

export type EventModuleRouteKey = EventModuleNavigationKey;

export type EventShellNavItem = {
  key: EventModuleRouteKey;
  label: string;
  iconKey: EventModuleRouteKey;
  description: string;
  enabled: boolean;
  badge?: number | string | null;
  minRole?: EventMemberRole;
};

export type EventModuleSnapshot = {
  key: EventModuleKey;
  enabled: boolean;
  position: number;
  giftsSettings?: {
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    budgetCapCents: number | null;
  };
};

export type EventShellNavigationContext = {
  eventOn?: Date | string | null;
  pollsCount: number;
  userRole: EventMemberRole;
  modules: EventModuleSnapshot[];
};

function getNavigationBadge(key: EventModuleKey, context: EventShellNavigationContext) {
  if (key === EventModuleKey.POLLS) {
    return context.pollsCount > 0 ? context.pollsCount : null;
  }

  return null;
}

export function buildEventShellNavigation(
  context: EventShellNavigationContext,
): EventShellNavItem[] {
  const moduleByKey = new Map(context.modules.map((module) => [module.key, module]));

  return EVENT_MODULE_REGISTRY.flatMap((definition) => {
    const eventModule = moduleByKey.get(definition.key);

    if (definition.key !== EventModuleKey.OVERVIEW && !eventModule) {
      return [];
    }

    const enabled =
      definition.key === EventModuleKey.OVERVIEW
        ? true
        : definition.organizerOnly
          ? eventModule?.enabled === true &&
            (context.userRole === EventMemberRole.ADMIN ||
              context.userRole === EventMemberRole.OWNER)
          : eventModule?.enabled === true;

    return [
      {
        key: definition.navigationKey,
        label: definition.label,
        iconKey: definition.navigationKey,
        description: definition.description,
        enabled,
        badge: getNavigationBadge(definition.key, context),
      },
    ];
  }).filter((item) => item.enabled || item.key === DEFAULT_EVENT_MODULE_ROUTE_KEY);
}

export function normalizeEventModuleRouteKey(value?: string | null): EventModuleRouteKey | null {
  if (!value) return null;

  const lower = value.toLowerCase() as EventModuleRouteKey;
  return getEventModuleByNavigationKey(lower)?.navigationKey ?? null;
}
