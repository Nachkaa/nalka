// app/(app)/event/[slug]/_components/activate-bring-dialog.tsx

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { activateBring } from "../actions/modules";

type ActivateBringDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
};

export function ActivateBringDialog({
  open,
  onOpenChange,
  eventId,
  slug,
}: ActivateBringDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    startTransition(async () => {
      const result = await activateBring({ eventId, slug });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de l'activation");
        return;
      }

      toast.success("Module activé !");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            Qui ramène quoi
          </DialogTitle>
          <DialogDescription>
            Organisez facilement qui apporte la nourriture, les boissons, la musique, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <h4 className="mb-2 text-sm font-medium">Ce module permet de :</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Créer des catégories (entrées, plats, desserts...)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Permettre aux participants de s&apos;inscrire</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Voir en temps réel qui apporte quoi</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleActivate} disabled={isPending}>
            {isPending ? "Activation..." : "Activer le module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
