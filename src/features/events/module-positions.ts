import { EventModuleKey } from "@prisma/client";

export const MODULE_POSITIONS: Record<EventModuleKey, number> = {
  OVERVIEW: 0,
  GIFTS: 1,
  SECRET_SANTA: 2,
  POTLUCK: 3,
  TIMELINE: 4,
  EXPENSES: 5,
  POLLS: 6,
  CHAT: 7,
};

export const ORDERED_MODULE_KEYS: EventModuleKey[] = Object.entries(MODULE_POSITIONS)
  .sort(([, a], [, b]) => a - b)
  .map(([key]) => key as EventModuleKey);
