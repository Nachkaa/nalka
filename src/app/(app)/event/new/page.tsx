import { createEvent } from "../actions";
import EventForm from "@/components/forms/EventForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="container mx-auto px-4 py-6 md:py-10">
      <header className="mb-6 md:mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Back link sits above title on mobile, right-aligned on desktop */}
        <Link
          href="/event"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline md:order-2"
          aria-label="Revenir à mes événements"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Revenir à mes événements</span>
        </Link>

        <h1 className="text-pretty text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          Préparez votre moment ensemble
        </h1>
      </header>

      <EventForm action={createEvent} />
    </main>
  );
}
