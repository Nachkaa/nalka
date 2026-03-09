// FILE: src/app/join/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvite } from "@/features/events/actions/invite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineMagicLink } from "@/features/auth/inline-magic-link";

type Search = { code?: string };

function getErrorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m !== "NEXT_REDIRECT") return m;
  }
  return "Impossible de rejoindre l’événement";
}

function isNextRedirect(e: unknown) {
  if (!e || typeof e !== "object") return false;
  const digest = (e as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export default async function JoinPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { code } = await searchParams;
  if (!code) redirect("/");

  const session = await auth();

  if (!session?.user?.email) {
    const from = `/join?code=${encodeURIComponent(code)}`;
    return (
      <section className="container mx-auto max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Rejoindre l’événement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Entrez votre e-mail pour recevoir un lien de connexion. Vous reviendrez ici pour
              accepter l’invitation.
            </p>
            <InlineMagicLink redirectTo={from} />
            <p className="text-muted-foreground text-xs">
              Déjà un compte ?{" "}
              <Link
                className="underline underline-offset-4"
                href={`/login?from=${encodeURIComponent(from)}`}
              >
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  try {
    const res = await acceptInvite(code);
    redirect(`/event/${res.slug}`);
  } catch (e: unknown) {
    if (isNextRedirect(e)) throw e;

    const msg = getErrorMessage(e);

    return (
      <section className="container mx-auto max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Invitation invalide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive text-sm">{msg}</p>
            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
              >
                Accueil
              </Link>
              <Link
                href={`/join?code=${encodeURIComponent(code)}`}
                className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm"
              >
                Réessayer
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
}
