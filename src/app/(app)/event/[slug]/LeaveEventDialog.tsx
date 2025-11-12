"use client";

import { useState, useTransition } from "react";
import { leaveEvent } from "./leave";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

export default function LeaveEventDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function action(formData: FormData) {
    startTransition(async () => {
      await leaveEvent(formData); // redirects on success
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Quitter
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter l’événement ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous allez manquer à vos proches !
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="eventId" value={eventId} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "…" : "Confirmer"}
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
