"use client";

import { MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BudgetPaymentMutationResult } from "@/features/budget/lib/payment-entry-form";
import { markPaymentEntryUnpaid } from "@/features/budget/server/mutations/mark-payment-entry-unpaid";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  paymentEntryId: string;
  paymentLabel: string;
  formattedAmount: string;
  formattedPaidAt: string;
};

export function UnmarkPaymentPaidButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result: BudgetPaymentMutationResult = await markPaymentEntryUnpaid({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        paymentEntryId: props.paymentEntryId,
      });
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.formError ?? "Erreur inattendue.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Options du paiement</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            Démarquer comme non réglé
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Démarquer ce paiement comme non réglé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmer le démarquage du paiement{" "}
              <strong>{props.paymentLabel}</strong> de{" "}
              <strong>{props.formattedAmount}</strong> (réglé le{" "}
              {props.formattedPaidAt}). Cette action sera enregistrée dans
              l&apos;historique du paiement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="px-1 text-sm text-red-600">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={pending}>
              {pending ? "En cours..." : "Démarquer comme non réglé"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
