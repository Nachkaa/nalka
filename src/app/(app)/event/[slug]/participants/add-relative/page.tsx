import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireEventForUser } from "@/features/events/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createEventRelativeAction } from "./actions";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

function initialsFromName(name: string) {
  return name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export default async function AddRelativePage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!slug) notFound();

  const { from: rawFrom } = await searchParams;
  const from = rawFrom === "participants" ? "participants" : "event";

  const session = await auth();
  if (!session?.user) return <main className="p-6">Non autorisé</main>;

  const meId =
    session.user.id ??
    (
      await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
    )?.id;

  if (!meId) return <main className="p-6">Non autorisé</main>;

  const event = await requireEventForUser(slug, meId);
  if (!event) notFound();

  const existingProfiles = await prisma.managedProfile.findMany({
    where: { ownerId: meId },
    orderBy: { firstName: "asc" },
  });

  const backHref = from === "participants" ? `/event/${slug}/participants` : `/event/${slug}`;

  const backLabel =
    from === "participants" ? "Revenir à la liste des participants" : "Revenir à l’événement";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <section className="bg-background space-y-4 rounded-xl border px-4 py-5">
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Ajouter un proche</h1>
          <p className="text-muted-foreground text-sm">
            Crée un participant sans compte (enfant, parent, etc.). Tout le monde pourra voir et
            réserver sur sa liste de cadeaux.
          </p>
        </div>

        <form action={createEventRelativeAction} className="space-y-4">
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="from" value={from} />

          {existingProfiles.length > 0 && (
            <fieldset className="bg-muted/40 space-y-2 rounded-lg border px-3 py-3">
              <legend className="text-muted-foreground text-xs font-medium">
                Utiliser un proche existant
              </legend>
              <p className="text-muted-foreground text-xs">
                Sélectionne un proche déjà enregistré, ou laisse vide pour en créer un nouveau juste
                en dessous.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingProfiles.map((p) => (
                  <label key={p.id} className="cursor-pointer">
                    <input type="radio" name="profileId" value={p.id} className="peer sr-only" />
                    <div className="flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs transition peer-checked:border-[var(--primary)] peer-checked:bg-[color-mix(in_oklch,var(--primary),white_90%)]">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-[0.65rem] font-semibold text-[var(--sidebar-primary)]">
                        {initialsFromName(p.firstName || "?")}
                      </span>
                      <span>
                        {p.firstName}
                        {p.birthYear && (
                          <span className="text-muted-foreground ml-1 text-[0.7rem]">
                            ({p.birthYear})
                          </span>
                        )}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-1 pt-1">
            <p className="text-muted-foreground text-xs font-medium">Ou créer un nouveau proche</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" autoComplete="off" placeholder="Léa" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthYear">
              Année de naissance <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              min="1900"
              max={new Date().getFullYear().toString()}
              placeholder="2019"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="addToFamily"
              className="border-muted-foreground h-4 w-4 rounded"
              defaultChecked
            />
            <span>Ajouter à mes proches pour le réutiliser plus tard</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" asChild>
              <Link href={backHref}>Annuler</Link>
            </Button>
            <Button type="submit">Ajouter le proche</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
