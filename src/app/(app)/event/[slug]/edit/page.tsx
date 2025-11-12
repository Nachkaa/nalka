import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventForm from "@/components/forms/EventForm";
import { updateEvent } from "./actions"; // create this or reuse your existing action

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const e = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true, title: true, description: true, eventOn: true, location: true,
      isSecretSanta: true, isNoSpoil: true, isAnonReservations: true,
      isSecondHandOk: true, isHandmadeOk: true, budgetCapCents: true,
    },
  });
  if (!e) redirect("/event");

  const initial = {
    title: e.title,
    description: e.description,
    dateISO: e.eventOn?.toISOString() ?? null,
    location: e.location,
    rules: {
      isSecretSanta: e.isSecretSanta,
      isNoSpoil: e.isNoSpoil,
      isAnonReservations: e.isAnonReservations,
      isSecondHandOk: e.isSecondHandOk,
      isHandmadeOk: e.isHandmadeOk,
      budgetCap: typeof e.budgetCapCents === "number" ? Math.round(e.budgetCapCents / 100) : null,
    },
  } as const;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <nav className="mb-4">
        <Link href={`/event/${slug}`} className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l’événement
        </Link>
      </nav>

      <h1 className="mb-4 text-pretty text-xl font-semibold leading-tight">Modifier l’événement</h1>

      <EventForm
        action={updateEvent.bind(null, e.id, slug)}
        initial={initial}
        submitLabel="Enregistrer les modifications"
        hideSuggestions
      />
    </main>
  );
}
