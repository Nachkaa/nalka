"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import type { BudgetLineMutationResult } from "@/features/budget/lib/budget-line-form";
import {
  BUDGET_LINE_CATEGORY_LABELS,
  BUDGET_LINE_CATEGORY_OPTIONS,
  BUDGET_LINE_SOURCING_STATUS_LABELS,
  EDITABLE_BUDGET_LINE_SOURCING_STATUSES,
} from "@/features/budget/lib/constants";
import type {
  BudgetLineCategory,
  BudgetLineSourcingStatus,
} from "@/features/budget/lib/types";
import { ChevronDown } from "lucide-react";
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
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    if (props.open) {
      setFormValues(props.values);
      setResult(null);
      setNoteOpen(false);
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
            <Label htmlFor="budget-line-category">Catégorie</Label>
            <Select
              value={formValues.category}
              onValueChange={(value) => setField("category", value as BudgetLineCategory)}
            >
              <SelectTrigger id="budget-line-category">
                <SelectValue placeholder="Choisir une catégorie" />
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
            <Label htmlFor="budget-line-label">
              Libellé du poste <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="budget-line-label"
              value={formValues.label}
              onChange={(event) => setField("label", event.target.value)}
              placeholder="Salle principale"
              aria-required="true"
            />
            {result?.fieldErrors?.label ? (
              <p className="text-sm text-red-600">{result.fieldErrors.label}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget-line-target">
                Budget prévu <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <p className="text-muted-foreground text-xs">Enveloppe prévue pour ce poste.</p>
              <Input
                id="budget-line-target"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={formValues.targetAmount}
                onChange={(event) => setField("targetAmount", event.target.value)}
                placeholder="0.00"
                aria-required="true"
              />
              {result?.fieldErrors?.targetAmount ? (
                <p className="text-sm text-red-600">{result.fieldErrors.targetAmount}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-line-estimated">Coût estimé</Label>
              <p className="text-muted-foreground text-xs">
                Meilleure estimation actuelle, avant sélection finale du devis.
              </p>
              <Input
                id="budget-line-estimated"
                type="number"
                inputMode="decimal"
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
                  setField(
                    "sourcingStatus",
                    value as Extract<BudgetLineSourcingStatus, "DRAFT" | "SOURCING">,
                  )
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

          <Collapsible open={noteOpen} onOpenChange={setNoteOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground flex items-center gap-1 text-sm"
              >
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ transform: noteOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
                {noteOpen ? "Masquer la note interne" : "Ajouter une note interne"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-2 pt-3">
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
            </CollapsibleContent>
          </Collapsible>

          {result?.formError ? <p className="text-sm text-red-600">{result.formError}</p> : null}
        </div>

        <DialogFooter className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            <span className="text-destructive">*</span> Champs obligatoires
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? "Enregistrement..." : props.submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
