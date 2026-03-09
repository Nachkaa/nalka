// app/(app)/event/[slug]/_components/header/LocationSetupDialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Vote } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { ensureLocationPoll, setEventLocationBySlug } from "../../actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
  initialLocation?: string | null;
};

export function LocationSetupDialog({
  open,
  onOpenChange,  slug,
  initialLocation,
}: Props) {
  const [value, setValue] = useState(initialLocation ?? "");
  const [pending, start] = useTransition();
  const [confirmReopenOpen, setConfirmReopenOpen] = useState(false);

  const canSave = useMemo(() => value.trim().length > 0, [value]);
  const hasFinalLocation = Boolean(initialLocation?.trim());
  const pollCtaLabel = hasFinalLocation ? "Relancer un sondage" : "Créer un sondage";

  const onCreatePoll = (allowReopen: boolean) => {
    start(async () => {
      const result = await ensureLocationPoll(slug, { allowReopen });
      if (!result.ok) return;
      setConfirmReopenOpen(false);
      onOpenChange(false);
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-lg max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Définir le lieu
            </DialogTitle>
            <DialogDescription>
              Soit tu fixes un lieu, soit tu lances un sondage. Simple.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Renseigner un lieu</div>
              <div className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ex: Chez Juliette / Restaurant X / En ligne..."
                  autoFocus
                />
                <Button
                  disabled={!canSave || pending}
                  onClick={() =>
                    start(async () => {
                      await setEventLocationBySlug(slug, value.trim());
                      onOpenChange(false);
                    })
                  }
                >
                  Enregistrer
                </Button>
              </div>
            </div>

            <div className="relative py-1">
              <div className="bg-border h-px w-full" />
              <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
                ou
              </span>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={() => {
                if (hasFinalLocation) {
                  setConfirmReopenOpen(true);
                  return;
                }
                onCreatePoll(false);
              }}
            >
              <Vote className="mr-2 h-4 w-4" />
              {pollCtaLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReopenOpen} onOpenChange={setConfirmReopenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relancer un sondage de lieu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un lieu est déjà défini. Tu peux relancer un vote si tu veux le remettre en discussion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => onCreatePoll(true)}>
              Relancer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

