import { EventMemberRole, EventModuleKey } from "@prisma/client";

export const DEFAULT_TAB_KEY = "overview" as const;

export const ALL_TAB_KEYS = [
  "overview",
  "gifts",
  "secret-santa",
  "potluck",
  "timeline",
  "expenses",
  "polls",
  "chat",
] as const;

export type EventTabKey = (typeof ALL_TAB_KEYS)[number];

export type EventTabDefinition = {
  key: EventTabKey;
  label: string;
  iconKey: EventTabKey;
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

export type EventTabContext = {
  scheduleMode?: string | null;
  locationMode?: string | null;
  eventOn?: Date | string | null;
  pollsCount: number;
  userRole: EventMemberRole;
  modules: EventModuleSnapshot[];
};

const TAB_META: Record<EventTabKey, { label: string; description: string }> = {
  overview: { label: "Overview", description: "Resume rapide de l'evenement" },
  gifts: { label: "Cadeaux", description: "Listes et idees cadeaux" },
  "secret-santa": { label: "Secret Santa", description: "Tirage au sort" },
  potluck: { label: "Potluck", description: "Qui apporte quoi" },
  timeline: { label: "Programme", description: "Moments et déroulé de la journée" },
  expenses: { label: "Depenses", description: "Suivi des couts" },
  polls: { label: "Sondages", description: "Decider ensemble" },
  chat: { label: "Chat", description: "Discussions" },
};

export function buildEventTabs(context: EventTabContext): EventTabDefinition[] {
  const modules = [...context.modules].sort((a, b) => a.position - b.position);
  const moduleByKey = new Map(modules.map((m) => [m.key, m]));

  const defs: Array<{ position: number; def: EventTabDefinition }> = [];

  const pushTab = (
    key: EventTabKey,
    enabled: boolean,
    position: number,
    extra?: Partial<EventTabDefinition>,
  ) => {
    const meta = TAB_META[key];
    defs.push({
      position,
      def: {
        key,
        label: meta.label,
        iconKey: key,
        description: meta.description,
        enabled,
        ...extra,
      },
    });
  };

  const overviewModule = moduleByKey.get(EventModuleKey.OVERVIEW);
  if (overviewModule) {
    pushTab("overview", true, overviewModule.position);
  } else {
    pushTab("overview", true, -1);
  }

  const giftsModule = moduleByKey.get(EventModuleKey.GIFTS);
  if (giftsModule) {
    pushTab("gifts", giftsModule.enabled, giftsModule.position);
  }

  const ssModule = moduleByKey.get(EventModuleKey.SECRET_SANTA);
  if (ssModule) {
    pushTab("secret-santa", ssModule.enabled, ssModule.position);
  }

  const potluckModule = moduleByKey.get(EventModuleKey.POTLUCK);
  if (potluckModule) {
    pushTab("potluck", potluckModule.enabled, potluckModule.position);
  }

  const timelineModule = moduleByKey.get(EventModuleKey.TIMELINE);
  if (timelineModule) {
    pushTab("timeline", timelineModule.enabled, timelineModule.position, {
      badge: context.eventOn ? null : undefined,
    });
  }

  const expensesModule = moduleByKey.get(EventModuleKey.EXPENSES);
  if (expensesModule) {
    pushTab("expenses", expensesModule.enabled, expensesModule.position);
  }

  const pollsModule = moduleByKey.get(EventModuleKey.POLLS);
  if (pollsModule) {
    pushTab("polls", pollsModule.enabled, pollsModule.position, {
      badge: context.pollsCount > 0 ? context.pollsCount : null,
    });
  }

  const chatModule = moduleByKey.get(EventModuleKey.CHAT);
  if (chatModule) {
    pushTab("chat", chatModule.enabled, chatModule.position);
  }

  return defs
    .sort((a, b) => a.position - b.position)
    .map((item) => item.def)
    .filter((tab) => tab.enabled || tab.key === DEFAULT_TAB_KEY);
}

export function normalizeTabKey(value?: string | null): EventTabKey | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return (ALL_TAB_KEYS.includes(lower as EventTabKey) ? lower : null) as EventTabKey | null;
}
