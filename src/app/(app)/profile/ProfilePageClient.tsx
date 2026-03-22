"use client";

import { Container } from "@/components/layout/Container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { deleteMyAccount, updateProfile } from "./actions";

type Props = {
  isGoogleLinked: boolean;
  googleLinkedJustNow: boolean;
};

export function ProfilePageClient({ isGoogleLinked, googleLinkedJustNow }: Props) {
  const { data: session, status, update } = useSession();

  const [name, setName] = useState(() => session?.user?.name ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isDeleting, startDelete] = useTransition();
  const [isLinkingGoogle, startLinkGoogle] = useTransition();
  const [googleError, setGoogleError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      setMessage("");
      try {
        await updateProfile(formData);
        await update();
        setMessage("Profil mis a jour.");
      } catch {
        setMessage("Erreur lors de la mise a jour.");
      }
    });
  };

  const handleLinkGoogle = () => {
    setGoogleError("");

    startLinkGoogle(async () => {
      try {
        const result = await signIn("google", {
          callbackUrl: "/profile?linked=google",
          redirect: false,
        });

        if (result?.error) {
          setGoogleError("Impossible d'associer Google pour le moment.");
          return;
        }

        if (result?.url) {
          window.location.assign(result.url);
          return;
        }

        setGoogleError("Impossible d'associer Google pour le moment.");
      } catch {
        setGoogleError("Impossible d'associer Google pour le moment.");
      }
    });
  };

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-sm text-neutral-500">Chargement du profil...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-sm text-neutral-600">
          Vous devez etre connecte pour acceder a votre profil.
        </p>
      </main>
    );
  }

  const displayName = name || session.user.name || "";

  return (
    <Container className="py-8">
      <main className="mx-auto max-w-md space-y-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mon profil</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Prenom / Pseudo</label>
              <input
                type="text"
                name="name"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
                placeholder="Ex. Aurele"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">Adresse e-mail</label>
              <input
                type="email"
                value={session.user.email ?? ""}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                L&apos;adresse e-mail ne peut pas etre modifiee.
              </p>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            {message ? (
              <p className="text-sm text-neutral-600" role="status" aria-live="polite">
                {message}
              </p>
            ) : null}
          </div>
        </form>

        <hr className="border-neutral-200" />

        <section aria-labelledby="security-zone" className="space-y-3">
          <h2 id="security-zone" className="text-lg font-semibold">
            Connexion et securite
          </h2>
          <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-neutral-900">Google</p>
                <p className="text-sm text-neutral-600">
                  Associez Google pour vous reconnecter plus rapidement ensuite.
                </p>
              </div>
              {isGoogleLinked ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Associe
                </span>
              ) : null}
            </div>

            {googleLinkedJustNow ? (
              <p className="text-sm text-emerald-700" role="status">
                Google est maintenant associe a votre compte.
              </p>
            ) : null}

            {!isGoogleLinked ? (
              <Button
                type="button"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                className="w-full"
              >
                {isLinkingGoogle ? "Redirection..." : "Associer Google"}
              </Button>
            ) : null}

            {googleError ? (
              <p className="text-sm text-destructive" role="alert">
                {googleError}
              </p>
            ) : null}
          </div>
        </section>

        <hr className="border-neutral-200" />

        <section aria-labelledby="danger-zone" className="space-y-3">
          <h2 id="danger-zone" className="text-lg font-semibold">
            Zone dangereuse
          </h2>
          <p className="text-sm text-neutral-600">
            Supprimer votre compte supprimera aussi vos evenements dont vous etes proprietaire.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="w-full">
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Action irreversible. Tapez{" "}
                  <span className="font-mono font-semibold">SUPPRIMER</span> pour confirmer.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <input
                aria-label="Confirmation"
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.toUpperCase())}
                placeholder="SUPPRIMER"
                autoFocus
              />

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirm !== "SUPPRIMER" || isDeleting}
                  onClick={() =>
                    startDelete(async () => {
                      await deleteMyAccount();
                      await signOut({ redirect: false, callbackUrl: "/" });
                      window.location.assign("/");
                    })
                  }
                >
                  {isDeleting ? "Suppression..." : "Confirmer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </Container>
  );
}
