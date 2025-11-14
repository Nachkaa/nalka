// src/features/events/components/DeleteEventSection.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/(app)/event/[slug]/actions"; // adapte le chemin si besoin
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Props = {
  eventId: string;
  title: string;
};

export function DeleteEventSection({ eventId, title }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", eventId);
      await deleteEvent(formData); // ton action existante doit déjà gérer redirect/revalidate
      router.refresh();
    });
  }

  return (
    <section className="mt-4 flex border-t pt-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm" 
            className="gap-2 w-full sm"
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Supprimer l’événement
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{title}</span> sera supprimé avec toutes les listes et
              invitations. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={pending}
              >
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
