import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { EventCreateStepper } from "@/app/(app)/event/new/_components/EventCreateStepper";
import { auth } from "@/auth";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

function getDisplayName(name?: string | null, email?: string | null) {
  const normalizedName = (name ?? "").trim();
  if (normalizedName) return normalizedName.split(/\s+/)[0];

  const normalizedEmail = (email ?? "").trim();
  if (normalizedEmail) return normalizedEmail.split("@")[0] || "vous";

  return "vous";
}

export default async function EventNewPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const displayName = getDisplayName(session?.user?.name, session?.user?.email);

  return (
    <main className="container mx-auto px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-center md:justify-between">
        <Link
          href={isAuthenticated ? "/event" : "/"}
          className="text-muted-foreground inline-flex w-fit items-center gap-1 text-sm underline-offset-4 hover:underline md:order-2"
          aria-label={isAuthenticated ? "Revenir à mes événements" : "Revenir à l'accueil"}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>{isAuthenticated ? "Revenir à mes événements" : "Revenir à l'accueil"}</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-pretty md:text-3xl">
            Configurez votre espace événement
          </h1>
          {!isAuthenticated ? (
            <p className="text-muted-foreground text-sm">
              Aucun compte nécessaire pour commencer.
            </p>
          ) : null}
        </div>
      </header>

      <EventCreateStepper displayName={displayName} isAuthenticated={isAuthenticated} />
    </main>
  );
}
