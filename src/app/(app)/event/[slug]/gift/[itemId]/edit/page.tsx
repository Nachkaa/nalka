import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { updateGift } from "../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GiftForm } from "@/components/forms/GiftForm";

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

      <GiftForm
        action={updateGift.bind(null, slug, item.id)}
        defaultValues={{
          title: item.title,
          url: item.url,
          note: item.note,
        }}
        submitLabel="Mettre à jour"
        footerClassName="sticky bottom-0 -mx-4 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      />
    </main>
  );
}