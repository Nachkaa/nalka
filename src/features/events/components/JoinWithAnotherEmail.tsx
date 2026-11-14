"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function JoinWithAnotherEmail({ code }: { code: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await signOut({ callbackUrl: `/join?code=${encodeURIComponent(code)}` });
          } catch {
            setPending(false);
            setError("Impossible de changer de compte. Réessayez.");
          }
        }}
      >
        {pending ? "Déconnexion…" : "Utiliser une adresse professionnelle"}
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
