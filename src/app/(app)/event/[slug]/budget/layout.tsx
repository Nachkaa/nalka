import { Container } from "@/components/layout/Container";
import { BudgetLocalNav } from "@/features/budget/components/budget-local-nav";
import { getEventShellFrame } from "@/features/events/get-event-shell-context";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { EventShellClient } from "../_components/shell/EventShellClient";
import { EventHeader } from "../_components/header";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BudgetLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const context = await getEventShellFrame({ slug });
  if (context.unauthorized) redirect(`/login?from=${encodeURIComponent(`/event/${slug}/budget`)}`);
  if (!context.modules.some((module) => module.key === "BUDGET" && module.enabled)) notFound();
  const providerBudget = context.isAdmin
    ? await prisma.budget.findUnique({
        where: { eventId: context.eventId },
        select: { setupStatus: true, _count: { select: { lines: true } } },
      })
    : null;
  const hasProviderBudget =
    !!providerBudget &&
    (providerBudget.setupStatus === "STARTED" || providerBudget._count.lines > 0);

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
                <BudgetLocalNav
                  eventSlug={slug}
                  isOrganizer={context.isAdmin}
                  hasProviderBudget={hasProviderBudget}
                />
              </Container>
            </div>

            <div>{props.children}</div>
          </div>
        </EventShellClient>
      </Container>
    </div>
  );
}
