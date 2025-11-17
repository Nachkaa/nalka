"use client";

import { useTransition } from "react";
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
import { finalizeMyList } from "./actions"; // à créer/compléter côté serveur

type Props = {
  eventId: string;
};

export function FinalizeGiftListDialog({ eventId }: Props) {
  const [isPending, startTransition] = useTransition();

  function action() {
    startTransition(async () => {
      await finalizeMyList(eventId);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
        >
          Valider ma liste
        </Button>
      </AlertDialogTrigger>

       <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tu finalises ta liste&nbsp;?</AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Une fois validée, ta liste sera considérée comme prête.
              </p>
              <p>
                Tu pourras encore modifier ou supprimer des cadeaux si besoin,
                mais ça pourra impacter les personnes qui avaient prévu quelque chose.
              </p>
              <p>Tu confirmes&nbsp;?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Continuer plus tard
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={action}
              disabled={isPending}
            >
              {isPending ? "…" : "Valider ma liste"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
