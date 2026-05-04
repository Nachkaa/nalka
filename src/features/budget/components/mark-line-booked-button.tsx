"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BudgetPaymentMutationResult } from "@/features/budget/lib/payment-entry-form";
import { markLineBooked } from "@/features/budget/server/mutations/mark-line-booked";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  lineLabel: string;
};

export function MarkLineBookedButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BudgetPaymentMutationResult | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await markLineBooked({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
      });

      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" />
        Marquer comme réservée
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmer la réservation</DialogTitle>
            <DialogDescription>
              Validez la réservation pour {props.lineLabel}. Vous pourrez ensuite suivre les paiements.
            </DialogDescription>
          </DialogHeader>

          {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
