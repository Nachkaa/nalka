import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EventCreateStepper } from "./_components/EventCreateStepper";

function getDisplayName(name?: string | null, email?: string | null) {
  const n = (name ?? "").trim();
  if (n) return n.split(/\s+/)[0]; // first name only

  const e = (email ?? "").trim();
  if (!e) return "…";
  return e.split("@")[0] || "…";
}

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");

  const displayName = getDisplayName(session.user?.name ?? null, session.user?.email ?? null);

  return (
    <main className="container mx-auto px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-center md:justify-between">
        <Link
          href="/event"
          className="text-muted-foreground inline-flex w-fit items-center gap-1 text-sm underline-offset-4 hover:underline md:order-2"
          aria-label="Revenir à mes événements"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Revenir à mes événements</span>
        </Link>

        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-pretty md:text-3xl">
          Préparez votre moment ensemble
        </h1>
      </header>

      <EventCreateStepper displayName={displayName} />
    </main>
  );
}
