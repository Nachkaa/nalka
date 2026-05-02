import { EventModuleKey } from "@prisma/client";

import { EVENT_MODULE_REGISTRY } from "./module-registry";

export const MODULE_POSITIONS: Record<EventModuleKey, number> = Object.fromEntries(
  EVENT_MODULE_REGISTRY.map((definition) => [definition.key, definition.position]),
) as Record<EventModuleKey, number>;

export const ORDERED_MODULE_KEYS: EventModuleKey[] = EVENT_MODULE_REGISTRY.map(
  (definition) => definition.key,
);
