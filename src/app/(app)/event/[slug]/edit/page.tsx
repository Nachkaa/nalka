// app/(app)/event/[slug]/edit/page.tsx

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BasicEventForm } from "./_components/BasicEventForm";
import { DeleteEventSection } from "./DeleteEventSection";

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      eventOn: true,
      eventTime: true,
      location: true,
    },
  });

  if (!event) redirect("/event");

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      {/* Navigation */}
      <nav>
        <Link
          href={`/event/${slug}`}
          className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l&apos;événement
        </Link>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Modifier l&apos;événement</h1>
        <p className="text-muted-foreground mt-1">Informations générales de votre événement</p>
      </div>

      {/* Formulaire SIMPLIFIÉ */}
      <BasicEventForm
        eventId={event.id}
        slug={slug}
        defaultValues={{
          title: event.title,
          description: event.description ?? "",
          eventOn: event.eventOn,
          eventTime: event.eventTime,
          location: event.location ?? "",
        }}
      />

      {/* Suppression */}
      <DeleteEventSection eventId={event.id} title={event.title} />
    </main>
  );
}
