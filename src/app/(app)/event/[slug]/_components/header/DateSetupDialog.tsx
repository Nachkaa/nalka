// src/app/(app)/event/[slug]/_components/header/DateSetupDialog.tsx
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
import { DatePickerISO } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setEventDateBySlug } from "@/features/events/server/event-details";
import { ensureSchedulePoll } from "@/features/polls/server/mutations";
import { Calendar, Vote } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slug: string;
  initialDate?: string | null;
};

function toISO(dateLike?: string | null) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return dateLike.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function DateSetupDialog({ open, onOpenChange, slug, initialDate }: Props) {
  const [value, setValue] = useState<string>(toISO(initialDate));
  const [pending, start] = useTransition();
  const [confirmReopenOpen, setConfirmReopenOpen] = useState(false);

  const canSave = useMemo(() => value.trim().length > 0, [value]);
  const hasFinalDate = Boolean(initialDate);
  const pollCtaLabel = hasFinalDate ? "Relancer un sondage" : "Créer un sondage";

  const onCreatePoll = (allowReopen: boolean) => {
    start(async () => {
      const result = await ensureSchedulePoll(slug, { allowReopen });
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
              <Calendar className="h-4 w-4" />
              Définir la date
            </DialogTitle>
            <DialogDescription>Fixe la date directement ou lance un sondage.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Renseigner une date</div>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <DatePickerISO
                    value={value}
                    onChange={(iso) => setValue(iso ?? "")}
                    placeholder="Sélectionner une date"
                    disabled={pending}
                    disablePast
                    autoOpen={false}
                  />
                </div>

                <Button
                  className="shrink-0"
                  disabled={!canSave || pending}
                  onClick={() =>
                    start(async () => {
                      await setEventDateBySlug(slug, value.trim());
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
                if (hasFinalDate) {
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
            <AlertDialogTitle>Relancer un sondage de date ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une date est déjà définie. Tu peux relancer un vote si tu veux la remettre en discussion.
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
