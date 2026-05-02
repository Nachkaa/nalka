"use client";

import { Button } from "@/components/ui/button";
import { BudgetLineFormDialog } from "@/features/budget/components/budget-line-form-dialog";
import { BUDGET_LINE_CATEGORY_LABELS } from "@/features/budget/lib/constants";
import type { BudgetLineFormValues } from "@/features/budget/components/budget-line-form-dialog";
import { createBudgetLine } from "@/features/budget/server/mutations/create-budget-line";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { ComponentProps } from "react";

type Props = {
  eventSlug: string;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  showPlusIcon?: boolean;
  initialValues?: Partial<BudgetLineFormValues>;
};

const DEFAULT_VALUES: BudgetLineFormValues = {
  category: "VENUE",
  label: "",
  targetAmount: "",
  estimatedAmount: "",
  internalNote: "",
  sourcingStatus: "DRAFT",
};

export function AddBudgetLineDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const initialValues: BudgetLineFormValues = {
    ...DEFAULT_VALUES,
    ...props.initialValues,
  };

  return (
    <>
      <Button
        type="button"
        variant={props.triggerVariant}
        className={props.triggerClassName}
        onClick={() => setOpen(true)}
      >
        {props.showPlusIcon === false ? null : <Plus className="h-4 w-4" />}
        {props.triggerLabel ?? "Ajouter un poste budgetaire"}
      </Button>

      <BudgetLineFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Ajouter un poste budgetaire"
        description={`Creez un nouveau poste pour commencer a suivre ${BUDGET_LINE_CATEGORY_LABELS[initialValues.category].toLowerCase()}.`}
        submitLabel="Creer le poste"
        values={initialValues}
        onSubmit={(values) =>
          createBudgetLine({
            eventSlug: props.eventSlug,
            category: values.category,
            label: values.label,
            targetAmount: values.targetAmount,
            estimatedAmount: values.estimatedAmount,
            internalNote: values.internalNote,
          })
        }
      />
    </>
  );
}
