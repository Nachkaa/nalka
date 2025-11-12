"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { sendMagicLink } from "@/app/login/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const Email = z.string().email().max(254);

export function InlineMagicLink({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) {
      setError("Adresse e-mail invalide");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await sendMagicLink({ email: parsed.data, redirectTo });
        setSent(true);
      } catch (err: any) {
        setError(err?.message || "Envoi impossible");
      }
    });
  };

  if (sent) {
    return (
      <p className="text-sm">
        Lien envoyé. Vérifiez votre boîte mail puis revenez ici pour accepter
        l’invitation.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error ? (
          <p id="email-error" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Recevoir le lien
      </Button>
    </form>
  );
}
