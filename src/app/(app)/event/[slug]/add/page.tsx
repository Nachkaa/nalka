import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addGift } from "./actions";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/forms/GiftForm";

export default async function AddGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

      <h1 className="mb-8 text-3xl font-semibold">Ajouter un cadeau</h1>

      <GiftForm
        action={addGift.bind(null, event.id, slug)}
        submitLabel="Ajouter"
        // on garde la même sticky bar qu'avant
        footerClassName="sticky bottom-0 -mx-6 mt-4 bg-[var(--background)]/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60"
      />
    </main>
  );
}