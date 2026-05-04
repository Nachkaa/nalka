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
    label: "Aperçu",
    description: "Brief, RSVP et prochaines actions",
    routeSlug: null,
    position: 0,
    organizerOnly: false,
    managerAvailability: "hidden",
    defaultEnabledOnCreate: true,
  },
  {
    key: EventModuleKey.TIMELINE,
    navigationKey: "timeline",
    label: "Programme",
    description: "Déroulé, horaires et lieux",
    routeSlug: "timeline",
    position: 1,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.POLLS,
    navigationKey: "polls",
    label: "Décisions",
    description: "Sondages et arbitrages",
    routeSlug: "polls",
    position: 2,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.BUDGET,
    navigationKey: "budget",
    label: "Budget",
    description: "Postes, devis et paiements",
    routeSlug: "budget",
    position: 3,
    organizerOnly: true,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.POTLUCK,
    navigationKey: "potluck",
    label: "Contributions",
    description: "Matériel et apports",
    routeSlug: "potluck",
    position: 4,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.GIFTS,
    navigationKey: "gifts",
    label: "Cadeaux",
    description: "Listes et idées contextuelles",
    routeSlug: "gifts",
    position: 5,
    organizerOnly: false,
    managerAvailability: "available",
    defaultEnabledOnCreate: false,
  },
  {
    key: EventModuleKey.SECRET_SANTA,
    navigationKey: "secret-santa",
    label: "Secret Santa",
    description: "Rituel interne avec tirage privé",
    routeSlug: "secret-santa",
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
    managerAvailability: "hidden",
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
