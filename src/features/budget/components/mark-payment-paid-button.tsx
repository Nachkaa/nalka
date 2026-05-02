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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BudgetPaymentMutationResult } from "@/features/budget/lib/payment-entry-form";
import { markPaymentEntryPaid } from "@/features/budget/server/mutations/mark-payment-entry-paid";
import { Check } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  paymentEntryId: string;
  paymentLabel: string;
};

export function MarkPaymentPaidButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [paidAt, setPaidAt] = useState("");
  const [result, setResult] = useState<BudgetPaymentMutationResult | null>(null);

  useEffect(() => {
    if (open) {
      setPaidAt("");
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await markPaymentEntryPaid({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        paymentEntryId: props.paymentEntryId,
        paidAt,
      });

      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Check className="h-4 w-4" />
        Marquer comme regle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Marquer comme regle</DialogTitle>
            <DialogDescription>
              Enregistrez le reglement pour {props.paymentLabel}. Laissez la date vide pour utiliser maintenant.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={`payment-paid-at-${props.paymentEntryId}`}>Regle le</Label>
            <Input
              id={`payment-paid-at-${props.paymentEntryId}`}
              type="datetime-local"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
            {result?.fieldErrors?.paidAt ? (
              <p className="text-sm text-red-600">{result.fieldErrors.paidAt}</p>
            ) : null}
            {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
          </div>

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
