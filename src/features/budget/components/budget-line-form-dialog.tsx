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
import {
  BUDGET_LINE_CATEGORY_LABELS,
  BUDGET_LINE_SOURCING_STATUS_LABELS,
  BUDGET_LINE_CATEGORY_OPTIONS,
  EDITABLE_BUDGET_LINE_SOURCING_STATUSES,
} from "@/features/budget/lib/constants";
import type { BudgetLineMutationResult } from "@/features/budget/lib/budget-line-form";
import type {
  BudgetLineCategory,
  BudgetLineSourcingStatus,
} from "@/features/budget/lib/types";
import { useEffect, useState, useTransition } from "react";

export type BudgetLineFormValues = {
  category: BudgetLineCategory;
  label: string;
  targetAmount: string;
  estimatedAmount: string;
  internalNote: string;
  sourcingStatus?: Extract<BudgetLineSourcingStatus, "DRAFT" | "SOURCING">;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  values: BudgetLineFormValues;
  includeStatusField?: boolean;
  onSubmit: (values: BudgetLineFormValues) => Promise<BudgetLineMutationResult>;
};

export function BudgetLineFormDialog(props: Props) {
  const [pending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<BudgetLineFormValues>(props.values);
  const [result, setResult] = useState<BudgetLineMutationResult | null>(null);

  useEffect(() => {
    if (props.open) {
      setFormValues(props.values);
      setResult(null);
    }
  }, [props.open, props.values]);

  const setField = <K extends keyof BudgetLineFormValues>(key: K, value: BudgetLineFormValues[K]) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const nextResult = await props.onSubmit(formValues);
      setResult(nextResult);
      if (nextResult.ok) {
        props.onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-line-category">Categorie</Label>
            <Select
              value={formValues.category}
              onValueChange={(value) => setField("category", value as BudgetLineCategory)}
            >
              <SelectTrigger id="budget-line-category">
                <SelectValue placeholder="Choisir une categorie" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_LINE_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category} value={category}>
                    {BUDGET_LINE_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {result?.fieldErrors?.category ? (
              <p className="text-sm text-red-600">{result.fieldErrors.category}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget-line-label">Libelle du poste</Label>
            <Input
              id="budget-line-label"
              value={formValues.label}
              onChange={(event) => setField("label", event.target.value)}
              placeholder="Salle principale"
            />
            {result?.fieldErrors?.label ? <p className="text-sm text-red-600">{result.fieldErrors.label}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget-line-target">Montant cible</Label>
              <Input
                id="budget-line-target"
                type="number"
                min="0"
                step="0.01"
                value={formValues.targetAmount}
                onChange={(event) => setField("targetAmount", event.target.value)}
                placeholder="0.00"
              />
              {result?.fieldErrors?.targetAmount ? (
                <p className="text-sm text-red-600">{result.fieldErrors.targetAmount}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-line-estimated">Montant estime</Label>
              <Input
                id="budget-line-estimated"
                type="number"
                min="0"
                step="0.01"
                value={formValues.estimatedAmount}
                onChange={(event) => setField("estimatedAmount", event.target.value)}
                placeholder="Optionnel"
              />
              {result?.fieldErrors?.estimatedAmount ? (
                <p className="text-sm text-red-600">{result.fieldErrors.estimatedAmount}</p>
              ) : null}
            </div>
          </div>

          {props.includeStatusField ? (
            <div className="grid gap-2">
              <Label htmlFor="budget-line-status">Statut de consultation</Label>
              <Select
                value={formValues.sourcingStatus}
                onValueChange={(value) =>
                  setField("sourcingStatus", value as Extract<BudgetLineSourcingStatus, "DRAFT" | "SOURCING">)
                }
              >
                <SelectTrigger id="budget-line-status">
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_BUDGET_LINE_SOURCING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {BUDGET_LINE_SOURCING_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {result?.fieldErrors?.sourcingStatus ? (
                <p className="text-sm text-red-600">{result.fieldErrors.sourcingStatus}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="budget-line-note">Note interne</Label>
            <Textarea
              id="budget-line-note"
              rows={4}
              value={formValues.internalNote}
              onChange={(event) => setField("internalNote", event.target.value)}
              placeholder="Note optionnelle pour les organisateurs"
            />
            {result?.fieldErrors?.internalNote ? (
              <p className="text-sm text-red-600">{result.fieldErrors.internalNote}</p>
            ) : null}
          </div>

          {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? "Enregistrement..." : props.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
