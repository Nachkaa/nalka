import { Container } from "@/components/layout/Container";
import { getEventRouteContext } from "@/features/events/get-event-shell-context";
import { notFound } from "next/navigation";

import { EventHeader } from "./_components/header";
import { EventModuleContent } from "./_components/shell/EventModuleContent";
import { EventShellClient } from "./_components/shell/EventShellClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug?: string }>;
};

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const context = await getEventRouteContext({ slug, activeModule: "overview" });
  if (context.unauthorized) {
    return <main className="p-6">Non autorise</main>;
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
