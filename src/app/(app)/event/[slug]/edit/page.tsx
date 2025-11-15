import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventForm from "@/components/forms/EventForm";
import { updateEvent } from "./actions";
import { DeleteEventSection } from "./DeleteEventSection";

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const e = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      eventOn: true,
      location: true,
      hasGifts: true,
      giftMode: true, // "HOST_LIST" | "SECRET_SANTA" | "PERSONAL_LISTS"
      isNoSpoil: true,
      isAnonReservations: true,
      isSecondHandOk: true,
      isHandmadeOk: true,
      budgetCapCents: true,
    },
  });

  if (!e) redirect("/event");

  const toUiMode = (
    mode: "HOST_LIST" | "SECRET_SANTA" | "PERSONAL_LISTS",
  ): "host-list" | "secret-santa" | "personal-lists" => {
    switch (mode) {
      case "HOST_LIST":
        return "host-list";
      case "SECRET_SANTA":
        return "secret-santa";
      case "PERSONAL_LISTS":
      default:
        return "personal-lists";
    }
  };

  const initial = {
    title: e.title,
    description: e.description,
    dateISO: e.eventOn?.toISOString() ?? null,
    location: e.location,
    hasGifts: e.hasGifts,
    rules: {
      mode: toUiMode(e.giftMode),
      isNoSpoil: e.isNoSpoil,
      isAnonReservations: e.isAnonReservations,
      isSecondHandOk: e.isSecondHandOk,
      isHandmadeOk: e.isHandmadeOk,
      budgetCap:
        typeof e.budgetCapCents === "number" ? e.budgetCapCents / 100 : null, // euros pour le form
    },
  } as const;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <nav className="mb-4">
        <Link
          href={`/event/${slug}`}
          className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l’événement
        </Link>
      </nav>

      <h1 className="mb-4 text-pretty text-xl font-semibold leading-tight">
        Modifier l’événement
      </h1>

      <EventForm
        action={updateEvent.bind(null, e.id, slug)}
        initial={initial}
        submitLabel="Enregistrer les modifications"
        hideSuggestions
      />

      <DeleteEventSection eventId={e.id} title={e.title} />
    </main>
  );
}
