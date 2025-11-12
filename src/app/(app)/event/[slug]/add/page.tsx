import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addGift } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SubmitButton from "@/components/forms/SubmitButton";
import FieldCharCount from "@/components/forms/FieldCharCount";
import FetchFromLink from "@/components/forms/FetchFromLink";

export default async function AddGiftPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!event) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/event/${slug}`} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l’événement
          </Link>
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-semibold">
        Ajouter un cadeau
      </h1>

      {/* single form incl. sticky footer */}
      <form action={addGift.bind(null, event.id, slug)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Nom <span className="text-red-600">*</span></Label>
          <Input id="title" name="title" required maxLength={120} />
          <div className="flex justify-end">
            <FieldCharCount forId="title" max={120} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="url">Lien</Label>
            <FetchFromLink urlInputId="url" titleInputId="title" noteInputId="note" />
          </div>
          <Input
            id="url"
            name="url"
            inputMode="url"
            placeholder="https://exemple.com/produit"
          />
          <p className="text-xs text-muted-foreground">
            Collez un lien. On complètera le nom et le commentaire si possible.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Commentaire</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            placeholder="Ex. couleur, taille, variante…"
          />
          <div className="flex justify-end">
            <FieldCharCount forId="note" max={500} />
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 mt-4 bg-[var(--background)]/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
          <SubmitButton className="w-full">Ajouter</SubmitButton>
        </div>
      </form>
    </main>
  );
}
