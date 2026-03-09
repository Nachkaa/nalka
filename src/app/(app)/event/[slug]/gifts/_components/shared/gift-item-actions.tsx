// app/(app)/event/[slug]/gifts/_components/shared/gift-item-actions.tsx

"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GiftIdeaDialog } from "./GiftIdeaDialog";

type Props = {
  slug: string;
  eventId: string;
  itemId: string;
  title: string;
  hasActive: boolean;
  isNoSpoil: boolean;
  deleteGift: (formData: FormData) => Promise<void>;
  defaultValues?: {
    title: string;
    url: string | null;
    note: string | null;
    imagePath: string | null;
  };
};

export function GiftItemActions({
  slug,
  eventId,
  itemId,
  title,
  hasActive,
  isNoSpoil,
  deleteGift,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  const reservationWarning = hasActive
    ? isNoSpoil
      ? "Ce cadeau est réservé. La personne sera prévenue par email si tu le modifies."
      : "Ce cadeau est réservé. La personne qui l'a réservé sera prévenue par email."
    : null;

  return (
    <div className="flex items-center gap-1">
      {/* EDIT */}
      {defaultValues ? (
        !hasActive ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Modifier"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <AlertDialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Modifier ce cadeau ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ce cadeau est actuellement réservé. Si tu le modifies, la personne qui l&apos;a réservé
                  sera prévenue par email.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setEditConfirmOpen(false);
                    setEditDialogOpen(true);
                  }}
                >
                  Continuer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      ) : null}

      <GiftIdeaDialog
        mode="edit"
        eventId={eventId}
        slug={slug}
        itemId={itemId}
        open={editDialogOpen}
        onOpenChange={(next) => {
          setEditDialogOpen(next);
          if (!next) setEditConfirmOpen(false);
        }}
        defaultValues={defaultValues}
        reservationWarning={reservationWarning}
      />

      {/* DELETE */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Supprimer">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasActive ? "Retirer cette idée ?" : "Supprimer cette idée ?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {!hasActive && (
                  <p>Tu veux supprimer {title} de ta liste ? Cette action est irréversible.</p>
                )}

                {hasActive && isNoSpoil && (
                  <>
                    <p>Tu veux retirer {title} de ta liste ?</p>
                    <p>
                      Ce cadeau est actuellement réservé. La personne sera prévenue et pourra
                      choisir autre chose.
                    </p>
                  </>
                )}

                {hasActive && !isNoSpoil && (
                  <>
                    <p>Tu veux retirer {title} de ta liste ?</p>
                    <p>
                      La personne qui l&apos;avait réservé sera prévenue et pourra choisir autre chose.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>

            <form
              action={(fd) => {
                fd.set("itemId", itemId);
                fd.set("eventId", eventId);

                startDelete(async () => {
                  await deleteGift(fd);
                  router.refresh();
                });
              }}
              className="w-full sm:w-auto"
            >
              <AlertDialogAction
                type="submit"
                disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
              >
                {isDeleting ? "Suppressioné" : hasActive ? "Retirer de ma liste" : "Supprimer"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
