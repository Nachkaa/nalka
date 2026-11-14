// FILE: src/app/join/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvite } from "@/features/events/actions/invite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineMagicLink } from "@/features/auth/inline-magic-link";
import { getAuthEntryUrl } from "@/features/auth/routes";
import { EventEmailDomainError } from "@/features/events/email-domain-policy";
import { getInviteEmailDomainPreview } from "@/features/events/server/invite-preview";
import { JoinWithAnotherEmail } from "@/features/events/components/JoinWithAnotherEmail";

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
    const preview = await getInviteEmailDomainPreview(code);
    if (!preview) {
      return (
        <section className="container mx-auto max-w-md px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Invitation indisponible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien à
                l’organisateur.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }
    return (
      <section className="container mx-auto max-w-md px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Rejoindre l’événement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Entrez votre e-mail pour recevoir un lien de connexion. Vous reviendrez ici pour
              accepter l’invitation.
            </p>
            {preview.allowedEmailDomains.length > 0 ? (
              <div className="bg-muted space-y-2 rounded-lg p-3 text-sm">
                <p className="font-medium">Utilisez votre adresse professionnelle</p>
                <p className="text-muted-foreground break-words">
                  Domaines autorisés :{" "}
                  {preview.allowedEmailDomains.map((domain) => `@${domain}`).join(", ")}. La
                  vérification par e-mail est obligatoire. Les invitations nominatives de
                  l’organisateur peuvent faire exception.
                </p>
              </div>
            ) : null}
            <InlineMagicLink redirectTo={from} />
            <p className="text-muted-foreground text-xs">
              Déjà un compte ?{" "}
              <Link className="underline underline-offset-4" href={getAuthEntryUrl(from)}>
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
    if (e instanceof EventEmailDomainError) {
      return (
        <section className="container mx-auto max-w-md px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Une adresse professionnelle est nécessaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p role="alert" className="text-sm">
                {msg}
              </p>
              <p className="text-muted-foreground text-sm break-words">
                Adresse connectée : {session.user.email}
              </p>
              <JoinWithAnotherEmail code={code} />
              <p className="text-muted-foreground text-sm">
                Vous êtes un intervenant externe ? Demandez une invitation nominative à
                l’organisateur.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }

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
