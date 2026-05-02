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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import type { LeaveEventAction } from "../types";

export function LeaveEventDialog({
  eventId,
  leaveEventAction,
}: {
  eventId: string;
  leaveEventAction: LeaveEventAction;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function action(formData: FormData) {
    startTransition(async () => {
      await leaveEventAction(formData);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Quitter l&apos;événement
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter cet événement&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous ne verrez plus les listes ni les mises à jour liées à cet événement. Vous pourrez
            revenir uniquement si l&apos;organisateur vous réinvite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="eventId" value={eventId} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "..." : "Oui, quitter l’événement"}
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
