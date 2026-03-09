// app/(app)/event/[slug]/gifts/[itemId]/edit/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { GiftForm } from "@/components/forms/GiftForm";
import { updateGift } from "../../actions";

type PageProps = {
  params: Promise<{ slug: string; itemId: string }>;
};

export default async function EditGiftPage({ params }: PageProps) {
  const { slug, itemId } = await params;
  const user = await getCurrentUser();

  if (!user) notFound();

  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: {
      list: {
        include: {
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!item || item.list.event.slug !== slug || item.list.ownerId !== user.userId) {
    notFound();
  }

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

      <h1 className="mb-8 text-3xl font-semibold">Modifier ton idée</h1>

      <GiftForm
        action={updateGift.bind(null, item.list.event.id, slug, itemId)}
        defaultValues={{
          title: item.title,
          url: item.url,
          note: item.note,
          imagePath: item.imagePath,
        }}
        submitLabel="Enregistrer"
        footerClassName="sticky bottom-0 -mx-6 mt-4 bg-[var(--background)]/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60"
      />
    </main>
  );
}
