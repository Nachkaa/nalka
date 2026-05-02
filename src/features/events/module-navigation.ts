import {
  getEventModuleByNavigationKey,
  type EventModuleNavigationKey,
} from "@/features/events/module-registry";

export function buildEventModulePath(
  eventSlug: string,
  key: EventModuleNavigationKey,
) {
  if (key === "overview") {
    return `/event/${eventSlug}`;
  }

  const definition = getEventModuleByNavigationKey(key);
  if (!definition?.routeSlug) {
    throw new Error(`Missing route slug for module navigation key: ${key}`);
  }

  return `/event/${eventSlug}/${definition.routeSlug}`;
}
