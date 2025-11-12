import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { updateGift } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/forms/SubmitButton";
import FieldCharCount from "@/components/forms/FieldCharCount";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FetchFromLink from "@/components/forms/FetchFromLink";

export default async function EditGiftPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!event) redirect(`/event/${slug}`);

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      url: true,
      note: true,
      list: { select: { ownerId: true, eventId: true } },
    },
  });
  if (!item || item.list.ownerId !== me?.id || item.list.eventId !== event.id) {
    redirect(`/event/${slug}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      {/* Back + title */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/event/${slug}`} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l’événement
          </Link>
        </Button>
      </div>

      <header className="mb-2">
        <h1 className="text-pretty text-xl font-semibold leading-tight">
          Modifier « {item.title} »
        </h1>
        <p className="text-sm text-muted-foreground">— {event.title}</p>
      </header>

      {/* Form */}
      <form action={updateGift.bind(null, slug, item.id)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">
            Nom <span className="text-red-600">*</span>
          </Label>
          <Input id="title" name="title" defaultValue={item.title} required maxLength={120} />
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
            defaultValue={item.url ?? ""}
            inputMode="url"
            placeholder="https://exemple.com/produit"
          />
          <p className="text-xs text-muted-foreground">
            Collez un lien. On essaiera de compléter le nom et le commentaire.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Commentaire</Label>
          <Textarea
            id="note"
            name="note"
            defaultValue={item.note ?? ""}
            rows={3}
            maxLength={500}
            placeholder="Ex. couleur, taille, variante…"
          />
          <div className="flex justify-end">
            <FieldCharCount forId="note" max={500} />
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 -mx-4 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SubmitButton className="w-full">Mettre à jour</SubmitButton>
        </div>
      </form>
    </main>
  );
}
