// app/(app)/event/[slug]/_components/activate-gifts-dialog.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EventGiftMode } from "@prisma/client";
import { activateGifts } from "../actions";

type ActivateGiftsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
};

export function ActivateGiftsDialog({
  open,
  onOpenChange,
  eventId,
  slug,
}: ActivateGiftsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [giftMode, setGiftMode] = useState<EventGiftMode>(EventGiftMode.HOST_LIST);

  const handleActivate = () => {
    startTransition(async () => {
      const result = await activateGifts(eventId, slug, giftMode);

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de l'activation");
        return;
      }

      toast.success("Module active !");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activer les cadeaux</DialogTitle>
          <DialogDescription>
            Choisissez le mode de gestion des listes de cadeaux pour votre evenement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Mode de liste</Label>
            <RadioGroup
              value={giftMode}
              onValueChange={(value) => setGiftMode(value as EventGiftMode)}
            >
              <div className="hover:bg-accent/50 flex items-start space-x-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem value={EventGiftMode.HOST_LIST} id="host-list" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="host-list" className="cursor-pointer font-medium">
                    Ma liste unique
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Une seule liste pour l&apos;organisateur.
                  </p>
                </div>
              </div>

              <div className="hover:bg-accent/50 flex items-start space-x-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem
                  value={EventGiftMode.PERSONAL_LISTS}
                  id="personal-lists"
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="personal-lists" className="cursor-pointer font-medium">
                    Listes personnelles
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Chaque participant cree sa propre liste.
                  </p>
                </div>
              </div>
            </RadioGroup>
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
