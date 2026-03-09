import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SuggestGiftAction } from "./actions";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/forms/GiftForm";

export default async function SuggestGiftPage({
  params,
}: {
  params: Promise<{ slug: string; listId: string }>;
}) {
  const { slug, listId } = await params;

  const list = await prisma.giftList.findUnique({
    where: { id: listId },
    include: { owner: true, eventRelative: true },
  });
  if (!list) notFound();

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

      <h1 className="mb-8 text-3xl font-semibold">Suggérer une idée</h1>

      <GiftForm action={SuggestGiftAction.bind(null, slug, list.id)} submitLabel="Suggérer" />
    </main>
  );
}
