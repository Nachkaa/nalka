"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { updateProfile, deleteMyAccount } from "./actions";
import { Button } from "@/components/ui/button";
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

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      setMessage("");
      try {
        await updateProfile(formData);
        await update();
        setMessage("Profil mis à jour.");
      } catch {
        setMessage("Erreur lors de la mise à jour.");
      }
    });
  };

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-sm text-neutral-500">Chargement du profil…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-sm text-neutral-600">
          Vous devez être connecté pour accéder à votre profil.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        {/* ThemeSwitch removed for now */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Prénom / Pseudo
            </label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              placeholder="Ex. Aurèle"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={session.user.email ?? ""}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-500"
            />
            <p className="mt-1 text-xs text-neutral-500">
              L’adresse e-mail ne peut pas être modifiée.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {message && (
            <p className="text-sm text-neutral-600" role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </form>

      <hr className="border-neutral-200" />

      <section aria-labelledby="danger-zone" className="space-y-3">
        <h2 id="danger-zone" className="text-lg font-semibold">Zone dangereuse</h2>
        <p className="text-sm text-neutral-600">
          Supprimer votre compte supprimera aussi vos événements dont vous êtes propriétaire.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="w-full">Supprimer mon compte</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Action irréversible. Tapez <span className="font-mono font-semibold">SUPPRIMER</span> pour confirmer.
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
                    await signOut({ redirect: true, callbackUrl: "/" });
                  })
                }
              >
                {isDeleting ? "Suppression…" : "Confirmer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}
