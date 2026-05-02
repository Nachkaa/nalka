import { Container } from "@/components/layout/Container";
import { BudgetLocalNav } from "@/features/budget/components/budget-local-nav";
import { getBudgetRouteContext } from "@/features/budget/server/get-budget-route-context";
import { EventShellClient } from "../_components/shell/EventShellClient";
import { EventHeader } from "../_components/header";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BudgetLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const context = await getBudgetRouteContext(slug);

  return (
    <div>
      <Container className="space-y-0">
        <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
          <Container className="py-3">
            <EventHeader
              event={context.headerEvent}
              slug={slug}
              schedulePollOpen={null}
              locationPollOpen={null}
              meId={context.meId}
              isAdmin={context.isAdmin}
              canEditEvent={context.isAdmin}
              canEditEventMeta={context.isAdmin}
              showBudget={false}
              participants={context.participants}
              rsvpSummary={context.rsvpSummary}
            />
          </Container>
        </div>

        <EventShellClient
          navigation={context.navigation}
          activeModule="budget"
          modules={context.modules}
          eventId={context.eventId}
          eventSlug={slug}
          canManageModules={context.isAdmin}
          giftMode={context.giftMode}
        >
          <div className="space-y-6">
            <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
              <Container>
                <BudgetLocalNav eventSlug={slug} hasLines={context.hasLines} />
              </Container>
            </div>

            <div>{props.children}</div>
          </div>
        </EventShellClient>
      </Container>
    </div>
  );
}
