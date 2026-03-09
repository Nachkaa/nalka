// src/components/user/AskNameDialog.tsx
"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AskNameDialog() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [value, setValue] = useState("");

  const shouldAskName = useMemo(() => {
    if (status !== "authenticated") return false;
    const rawName = session?.user?.name ?? "";
    return rawName.trim().length < 2;
  }, [status, session?.user?.name]);

  const open = shouldAskName && !dismissed;

  if (status !== "authenticated") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (v.length < 2) return;

    const res = await fetch("/api/user/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: v }),
    });

    if (res.ok) {
      setDismissed(true);
      window.location.reload();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // si l’utilisateur ferme, on “dismiss” pour éviter réouverture en boucle
        if (!next) setDismissed(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ton prénom ?</DialogTitle>
          <DialogDescription>C’est plus sympa que ton e-mail.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ton prénom"
            autoFocus
          />

          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
