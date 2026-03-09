import React from "react";
import type { EventTabKey } from "./event-tabs.config";
import type { ModuleProps } from "./module-props";

type PropKey = keyof ModuleProps;
type ModuleComponent = React.ComponentType<unknown>;

const propKeyByTab: Record<EventTabKey, PropKey> = {
  overview: "overview",
  gifts: "gifts",
  "secret-santa": "secretSanta",
  potluck: "potluck",
  timeline: "timeline",
  expenses: "expenses",
  polls: "polls",
  chat: "chat",
};

const moduleLoaders: Record<EventTabKey, () => Promise<ModuleComponent>> = {
  overview: async () =>
    (await import("./modules/OverviewModule")).OverviewModule as unknown as ModuleComponent,
  gifts: async () => (await import("./modules/GiftsModule")).GiftsModule as unknown as ModuleComponent,
  "secret-santa": async () =>
    (await import("./modules/SecretSantaModule")).SecretSantaModule as unknown as ModuleComponent,
  potluck: async () =>
    (await import("./modules/PotluckModule")).PotluckModule as unknown as ModuleComponent,
  timeline: async () =>
    (await import("./modules/TimelineModule")).TimelineModule as unknown as ModuleComponent,
  expenses: async () =>
    (await import("./modules/ExpensesModule")).ExpensesModule as unknown as ModuleComponent,
  polls: async () => (await import("./modules/PollsModule")).PollsModule as unknown as ModuleComponent,
  chat: async () => (await import("./modules/ChatModule")).ChatModule as unknown as ModuleComponent,
};

const moduleCache: Partial<Record<EventTabKey, Promise<ModuleComponent>>> = {};

async function getModule(key: EventTabKey) {
  if (!moduleCache[key]) {
    moduleCache[key] = moduleLoaders[key]();
  }
  return moduleCache[key]!;
}

export async function ModuleRenderer({
  activeTab,
  moduleProps,
}: {
  activeTab: EventTabKey;
  moduleProps: ModuleProps;
}) {
  const tryRender = async (key: EventTabKey) => {
    const propsKey = propKeyByTab[key];
    const props = moduleProps[propsKey];
    if (!props && key !== "overview") return null;
    const Module = await getModule(key);
    const resolvedProps = (props ?? moduleProps.overview) as Record<string, unknown>;
    return <Module {...resolvedProps} />;
  };

  return (await tryRender(activeTab)) ?? (await tryRender("overview"));
}
