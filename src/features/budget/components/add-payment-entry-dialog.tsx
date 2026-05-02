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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_ENTRY_TYPE_LABELS } from "@/features/budget/lib/constants";
import type { BudgetPaymentMutationResult } from "@/features/budget/lib/payment-entry-form";
import { createPaymentEntry } from "@/features/budget/server/mutations/create-payment-entry";
import { Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  lineLabel: string;
  selectedQuoteId?: string | null;
};

export function AddPaymentEntryDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BudgetPaymentMutationResult | null>(null);
  const [label, setLabel] = useState("");
  const [entryType, setEntryType] = useState<"DEPOSIT" | "BALANCE" | "OTHER">("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setLabel("");
      setEntryType("DEPOSIT");
      setAmount("");
      setDueDate("");
      setNote("");
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await createPaymentEntry({
        eventSlug: props.eventSlug,
        budgetLineId: props.budgetLineId,
        quoteId: props.selectedQuoteId ?? "",
        label,
        entryType,
        amount,
        dueDate,
        note,
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
        <Plus className="h-4 w-4" />
        Ajouter un paiement
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement prévu pour {props.lineLabel}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`payment-label-${props.budgetLineId}`}>
                Libellé{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id={`payment-label-${props.budgetLineId}`}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                aria-required="true"
              />
              {result?.fieldErrors?.label ? (
                <p className="text-sm text-red-600">{result.fieldErrors.label}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`payment-entry-type-${props.budgetLineId}`}>Type de paiement</Label>
                <Select value={entryType} onValueChange={(value) => setEntryType(value as typeof entryType)}>
                  <SelectTrigger id={`payment-entry-type-${props.budgetLineId}`}>
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_ENTRY_TYPE_LABELS).map(([value, labelText]) => (
                      <SelectItem key={value} value={value}>
                        {labelText}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {result?.fieldErrors?.entryType ? (
                  <p className="text-sm text-red-600">{result.fieldErrors.entryType}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`payment-amount-${props.budgetLineId}`}>
                  Montant{" "}
                  <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id={`payment-amount-${props.budgetLineId}`}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-required="true"
                />
                {result?.fieldErrors?.amount ? (
                  <p className="text-sm text-red-600">{result.fieldErrors.amount}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`payment-due-date-${props.budgetLineId}`}>
                Date d&apos;échéance{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id={`payment-due-date-${props.budgetLineId}`}
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                aria-required="true"
              />
              {result?.fieldErrors?.dueDate ? (
                <p className="text-sm text-red-600">{result.fieldErrors.dueDate}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`payment-note-${props.budgetLineId}`}>Note</Label>
              <Textarea
                id={`payment-note-${props.budgetLineId}`}
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
          </div>

          <DialogFooter className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Annuler
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                {pending ? "Enregistrement…" : "Ajouter le paiement"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
