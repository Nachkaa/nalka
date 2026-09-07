import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { requireCurrentUserId } from "@/features/auth/server/require-current-user-id";
import { claimEventDraft } from "@/features/events/server/event-draft";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

type Props = {
  searchParams: Promise<{ draft?: string }>;
};

function buildLoginUrl(token: string) {
  const from = `/event/new/claim?draft=${encodeURIComponent(token)}`;
  return `/login?${new URLSearchParams({ from, intent: "create-event" }).toString()}`;
}

export default async function ClaimEventDraftPage({ searchParams }: Props) {
  const { draft: token = "" } = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginUrl(token));
  }

  const userId = await requireCurrentUserId();
  const result = await claimEventDraft(token, userId);

  if (result.ok) {
    redirect(`/event/${result.slug}`);
  }

  const expired = result.reason === "expired";

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12">
      <section className="w-full max-w-lg space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {expired ? "Ce brouillon a expiré" : "Ce brouillon n'est plus disponible"}
          </h1>
          <p className="text-muted-foreground">
            {expired
              ? "Les brouillons non enregistrés sont conservés pendant 24 heures."
              : "Il a peut-être déjà été enregistré avec un autre compte ou le lien n'est plus valide."}
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/event/new">Créer un nouvel événement</Link>
        </Button>
      </section>
    </main>
  );
}
