// app/(app)/event/[slug]/gifts/add/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/forms/GiftForm";
import { addGift } from "../actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AddGiftPage({ params }: PageProps) {
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
          <Link href={`/event/${slug}/gifts`} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux cadeaux
          </Link>
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-semibold">Ajouter une idée à ta liste</h1>

      <GiftForm
        action={addGift.bind(null, event.id, slug)}
        submitLabel="Ajouter"
        footerClassName="sticky bottom-0 -mx-6 mt-4 bg-[var(--background)]/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60"
      />
    </main>
  );
}
