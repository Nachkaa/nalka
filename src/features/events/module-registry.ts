import { EventModuleKey } from "@prisma/client";

export type EventModuleNavigationKey =
  | "overview"
  | "gifts"
  | "secret-santa"
  | "potluck"
  | "timeline"
  | "budget"
  | "polls"
  | "chat";

export type EventModuleManagerAvailability = "hidden" | "available" | "coming-soon";

export type EventModuleDefinition = {
  key: EventModuleKey;
  navigationKey: EventModuleNavigationKey;
  label: string;
  description: string;
  routeSlug: string | null;
  position: number;
  organizerOnly: boolean;
  managerAvailability: EventModuleManagerAvailability;
  defaultEnabledOnCreate: boolean;
};

export const EVENT_MODULE_REGISTRY: readonly EventModuleDefinition[] = [
  {
    key: EventModuleKey.OVERVIEW,
    navigationKey: "overview",
    label: "Overview",
    description: "Resume rapide de l'evenement",
    routeSlug: null,
    position: 0,
    organizerOnly: false,
    managerAvailability: "hidden",
    defaultEnabledOnCreate: true,
  },
  {
    key: EventModuleKey.GIFTS,
    navigationKey: "gifts",
    label: "Cadeaux",
    description: "Listes et idees cadeaux",
    routeSlug: "gifts",
    position: 1,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.SECRET_SANTA,
    navigationKey: "secret-santa",
    label: "Secret Santa",
    description: "Tirage au sort",
    routeSlug: "secret-santa",
    position: 2,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.POTLUCK,
    navigationKey: "potluck",
    label: "Potluck",
    description: "Qui apporte quoi",
    routeSlug: "potluck",
    position: 3,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.TIMELINE,
    navigationKey: "timeline",
    label: "Programme",
    description: "Moments et deroule de la journee",
    routeSlug: "timeline",
    position: 4,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.BUDGET,
    navigationKey: "budget",
    label: "Budget",
    description: "Budget, lignes et devis",
    routeSlug: "budget",
    position: 5,
    organizerOnly: true,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.POLLS,
    navigationKey: "polls",
    label: "Sondages",
    description: "Decider ensemble",
    routeSlug: "polls",
    position: 6,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.CHAT,
    navigationKey: "chat",
    label: "Chat",
    description: "Discussions",
    routeSlug: "chat",
    position: 7,
    organizerOnly: false,
    managerAvailability: "coming-soon",
    defaultEnabledOnCreate: false,
  },
] as const satisfies readonly EventModuleDefinition[];

export const EVENT_MODULE_REGISTRY_BY_KEY = new Map(
  EVENT_MODULE_REGISTRY.map((definition) => [definition.key, definition]),
);

export const EVENT_MODULE_REGISTRY_BY_NAVIGATION_KEY = new Map(
  EVENT_MODULE_REGISTRY.map((definition) => [definition.navigationKey, definition]),
);

export function listEventModules() {
  return [...EVENT_MODULE_REGISTRY];
}

export function getEventModuleDefinition(key: EventModuleKey) {
  return EVENT_MODULE_REGISTRY_BY_KEY.get(key);
}

export function getEventModuleByNavigationKey(key: EventModuleNavigationKey) {
  return EVENT_MODULE_REGISTRY_BY_NAVIGATION_KEY.get(key);
}

export function getEventModulePosition(key: EventModuleKey) {
  const definition = getEventModuleDefinition(key);
  if (!definition) {
    throw new Error(`Unknown event module key: ${key}`);
  }

  return definition.position;
}

export function getEventModuleNavigationKeys() {
  return EVENT_MODULE_REGISTRY.map((definition) => definition.navigationKey);
}

export function listModuleManagerDefinitions() {
  return EVENT_MODULE_REGISTRY.filter(
    (definition) => definition.managerAvailability !== "hidden",
  );
}

export function buildEventModuleSeeds(
  overrides: Partial<Record<EventModuleKey, boolean>> = {},
): Array<{ key: EventModuleKey; enabled: boolean; position: number }> {
  return EVENT_MODULE_REGISTRY.map((definition) => ({
    key: definition.key,
    enabled: overrides[definition.key] ?? definition.defaultEnabledOnCreate,
    position: definition.position,
  }));
}
