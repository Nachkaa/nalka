// FILE: src/app/(app)/event/[slug]/_components/GiftItemActions.tsx
// @deprecated Legacy gift actions. Use @/features/gifts/components/GiftItemActions instead.
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
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
  slug: string;
  eventId: string;
  itemId: string;
  title: string;
  hasActive: boolean;
  isNoSpoil: boolean;
  deleteGift: (formData: FormData) => Promise<void>;
};

export function GiftItemActions({
  slug,
  eventId,
  itemId,
  title,
  hasActive,
  isNoSpoil,
  deleteGift,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // IMPORTANT:
  // - EDIT: 3 branches (no reservation / reserved + noSpoil / reserved + spoil)
  // - DELETE: always visible; submit is a real <form action>, and we put destructive styles on AlertDialogAction.
  return (
    <div className="mt-1 flex items-center justify-end gap-2 md:mt-0 md:flex-shrink-0">
      {/* EDIT */}
      {!hasActive ? (
        <Link href={`/event/${slug}/gift/${itemId}/edit`}>
          <Button variant="outline" size="icon" className="h-8 w-8" title="Modifier">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      ) : isNoSpoil ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" title="Modifier">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifier ce cadeau&nbsp;?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>Modifier ce cadeau peut impacter quelqu’un qui avait prévu de te l’offrir.</p>
                  <p>Si quelqu’un l’a déjà réservé, il sera prévenu de ton changement.</p>
                  <p>Tu veux quand même continuer&nbsp;?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href={`/event/${slug}/gift/${itemId}/edit`}>
                  <Button disabled={isPending}>Continuer</Button>
                </Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" title="Modifier">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ce cadeau est déjà réservé</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>Modifier ces informations peut impacter la personne qui te l’offrira.</p>
                  <p>Tu veux quand même continuer&nbsp;?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href={`/event/${slug}/gift/${itemId}/edit`}>
                  <Button variant="outline" disabled={isPending}>
                    Continuer
                  </Button>
                </Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* DELETE */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8" title="Supprimer">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {!hasActive
                ? "Supprimer ce cadeau ?"
                : isNoSpoil
                  ? "Retirer ce cadeau ?"
                  : "Ce cadeau est réservé"}
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="text-muted-foreground space-y-2 text-sm">
                {!hasActive && <p>« {title} » sera retiré de ta liste.</p>}

                {hasActive && isNoSpoil && (
                  <>
                    <p>Tu veux vraiment retirer « {title} » de ta liste&nbsp;?</p>
                    <p>
                      Si quelqu’un l’a déjà réservé, il sera prévenu et pourra choisir autre chose.
                    </p>
                  </>
                )}

                {hasActive && !isNoSpoil && (
                  <>
                    <p>Tu veux retirer « {title} » de ta liste&nbsp;?</p>
                    <p>
                      La personne qui l’avait réservé sera prévenue et pourra choisir autre chose.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isPending}>
              Annuler
            </AlertDialogCancel>

            {/* form submit = fiable avec Server Actions */}
            <form
              action={(fd) => {
                fd.set("itemId", itemId);
                fd.set("eventId", eventId);

                startTransition(async () => {
                  await deleteGift(fd);
                });
              }}
              className="w-full sm:w-auto"
            >
              <AlertDialogAction
                type="submit"
                disabled={isPending}
                className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
              >
                {isPending ? "Suppression…" : hasActive ? "Retirer de ma liste" : "Supprimer"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
