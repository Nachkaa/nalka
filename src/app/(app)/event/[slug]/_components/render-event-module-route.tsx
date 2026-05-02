import { Container } from "@/components/layout/Container";
import { getEventRouteContext } from "@/features/events/get-event-shell-context";
import type { EventModuleNavigationKey } from "@/features/events/module-registry";
import { redirect } from "next/navigation";

import { EventHeader } from "./header";
import { EventModuleContent } from "./shell/EventModuleContent";
import { EventShellClient } from "./shell/EventShellClient";

type RenderEventModuleRouteArgs = {
  slug: string;
  tab: Exclude<EventModuleNavigationKey, "overview" | "budget">;
};

export async function renderEventModuleRoute({ slug, tab }: RenderEventModuleRouteArgs) {
  const context = await getEventRouteContext({ slug, activeModule: tab });
  if (context.unauthorized) {
    return <main className="p-6">Non autorise</main>;
  }

  if (context.activeModule !== tab) {
    const pathname =
      context.activeModule === "overview"
        ? `/event/${slug}`
        : `/event/${slug}/${context.activeModule}`;
    redirect(pathname);
  }

  return (
    <div>
      <Container className="space-y-0">
        <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
          <Container className="py-3">
            <EventHeader
              event={context.headerEvent}
              slug={slug}
              schedulePollOpen={context.schedulePollOpen}
              locationPollOpen={context.locationPollOpen}
              meId={context.meId}
              isAdmin={context.isAdmin}
              canEditEvent={context.isAdmin}
              canEditEventMeta={context.isAdmin}
              showBudget={context.showBudget}
              participants={context.participants}
              rsvpSummary={context.rsvpSummary}
            />
          </Container>
        </div>

        <EventShellClient
          navigation={context.navigation}
          activeModule={context.activeModule}
          modules={context.modules}
          eventId={context.eventId}
          eventSlug={context.eventSlug}
          canManageModules={context.isAdmin}
          giftMode={context.giftMode}
        >
          <EventModuleContent
            activeModule={context.activeModule}
            moduleProps={context.moduleProps}
          />
        </EventShellClient>
      </Container>
    </div>
  );
}
