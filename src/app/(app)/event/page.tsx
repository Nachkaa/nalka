import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventList } from "@/components/events/event-list";
import { getUserEventSummaries } from "@/features/events/queries";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/signin");

  let userId = session.user.id as string | undefined;
  if (!userId && session.user.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    userId = u?.id;
  }
  if (!userId) redirect("/signin");

  const events = await getUserEventSummaries(userId);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-[calc(88px+env(safe-area-inset-bottom))] md:py-12 md:pb-12">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-pretty text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">
          Mes événements
        </h1>

        {/* Desktop/tablet CTA */}
        <Link
          href="/event/new"
          className="hidden md:inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
          aria-label="Créer un nouvel événement"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvel événement
        </Link>
      </header>

      <EventList initialEvents={events} />

      {/* Mobile FAB */}
      <div className="mt-6 md:hidden">
        <Link
          href="/event/new"
          className="block w-full rounded-xl bg-[var(--primary)] py-3 text-center font-medium text-[var(--primary-foreground)] hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
        >
          + Nouvel événement
        </Link>
      </div>
    </main>
  );
}
