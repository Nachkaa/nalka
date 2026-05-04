"use client";

import { Button } from "@/components/ui/button";
import { BudgetLineFormDialog } from "@/features/budget/components/budget-line-form-dialog";
import type { BudgetLineRow } from "@/features/budget/lib/types";
import { updateBudgetLine } from "@/features/budget/server/mutations/update-budget-line";
import { Pencil } from "lucide-react";
import { useState } from "react";

export function EditBudgetLineDialog(props: {
  eventSlug: string;
  line: BudgetLineRow;
}) {
  const [open, setOpen] = useState(false);
  const isEditable = props.line.sourcingStatus === "DRAFT" || props.line.sourcingStatus === "SOURCING";

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={!isEditable}>
        <Pencil className="h-4 w-4" />
        Modifier
      </Button>

      <BudgetLineFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Modifier le poste budgétaire"
        description="Mettez à jour les informations utiles pour ce poste."
        submitLabel="Enregistrer"
        includeStatusField
        values={{
          category: props.line.category,
          label: props.line.label,
          targetAmount: props.line.targetAmount,
          estimatedAmount: props.line.estimatedAmount ?? "",
          internalNote: props.line.internalNote ?? "",
          sourcingStatus: props.line.sourcingStatus === "SOURCING" ? "SOURCING" : "DRAFT",
        }}
        onSubmit={(values) =>
          updateBudgetLine({
            eventSlug: props.eventSlug,
            budgetLineId: props.line.id,
            category: values.category,
            label: values.label,
            targetAmount: values.targetAmount,
            estimatedAmount: values.estimatedAmount,
            internalNote: values.internalNote,
            sourcingStatus: values.sourcingStatus,
          })
        }
      />
    </>
  );
}
