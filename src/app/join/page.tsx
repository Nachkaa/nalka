import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvite } from "@/features/events/actions/invite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineMagicLink } from "@/features/auth/inline-magic-link";

type Search = { code?: string };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
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
            <p className="text-sm text-muted-foreground">
              Entrez votre e-mail pour recevoir un lien de connexion. Vous
              reviendrez ici pour accepter l’invitation.
            </p>
            <InlineMagicLink redirectTo={from} />
            <p className="text-xs text-muted-foreground">
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

  // Authenticated: accept then redirect
  let res: { slug: string };
  try {
    res = await acceptInvite(code);
  } catch (e: any) {
    if (e?.digest === "NEXT_REDIRECT") throw e;
    const msg = e?.message ?? "Impossible de rejoindre l’événement";
    return (
      <section className="container mx-auto max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Invitation invalide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{msg}</p>
            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
              >
                Accueil
              </Link>
              <Link
                href={`/join?code=${encodeURIComponent(code)}`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm text-primary-foreground"
              >
                Réessayer
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  redirect(`/event/${res.slug}`);
}
