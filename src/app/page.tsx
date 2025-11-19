import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { Hero } from "@/components/home/Hero";
import { Manifest } from "@/components/home/Manifest";
import { UseCases } from "@/components/home/UseCases";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CtaFinal } from "@/components/home/CtaFinal";
import { UpcomingEventsStrip } from "@/components/events/UpcomingEventsStrip";

export default async function HomePage() {
  const session = await auth();

  let upcomingEvents: {
    id: string;
    slug: string;
    title: string;
    eventOn: Date;
    location: string | null;
  }[] = [];

  if (session?.user?.id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    upcomingEvents = await prisma.event.findMany({
      where: {
        eventOn: { gte: today },
        memberships: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { eventOn: "asc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        eventOn: true,
        location: true,
      },
    });
  }

  return (
    <main className="min-h-dvh bg-cream text-forest antialiased">
      {/* Bandeau “Tes prochains moments” (uniquement si connecté + events à venir) */}
      <UpcomingEventsStrip events={upcomingEvents} />

      <Hero />
      <Manifest />
      <UseCases />
      <HowItWorks />
      <CtaFinal />
    </main>
  );
}