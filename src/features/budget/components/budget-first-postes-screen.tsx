"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { BudgetTotalSetupCard } from "@/features/budget/components/budget-total-setup-card";
import { formatMoney } from "@/features/budget/lib/serializers";
import type { BudgetLineCategory } from "@/features/budget/lib/types";

const QUICK_ADD_CATEGORIES: Array<{ category: BudgetLineCategory; label: string }> = [
  { category: "VENUE", label: "Lieu" },
  { category: "FOOD_BEVERAGE", label: "Restauration" },
  { category: "DESIGN_DECORATION", label: "Décoration" },
  { category: "ENTERTAINMENT", label: "Animation" },
  { category: "LOGISTICS", label: "Logistique" },
];

type Props = {
  eventSlug: string;
  currency: string;
  totalBudget: string;
  hasDefinedTotal: boolean;
};

export function BudgetFirstPostesScreen({
  eventSlug,
  currency,
  totalBudget,
  hasDefinedTotal,
}: Props) {
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);

  const budgetLabel = useMemo(() => formatMoney(totalBudget, currency), [currency, totalBudget]);

  return (
    <div className="space-y-6 pb-10">
      {hasDefinedTotal ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget global</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{budgetLabel}</p>
          </CardContent>
        </Card>
      ) : showBudgetSetup ? (
        <BudgetTotalSetupCard
          eventSlug={eventSlug}
          title="Définir le budget global"
          intro="Définissez un budget global, puis créez vos premiers postes pour suivre les dépenses et comparer les devis."
          compact
          onSuccess={() => setShowBudgetSetup(false)}
        />
      ) : (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget global</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Le budget global pourra être défini plus tard.
            </p>
            <Button type="button" variant="outline" onClick={() => setShowBudgetSetup(true)}>
              Définir maintenant
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Ajoutez vos premiers postes</CardTitle>
          <p className="text-muted-foreground text-sm">
            Créez un poste pour chaque grand sujet de dépense. Vous pourrez ensuite estimer le
            montant, comparer les devis et suivre les paiements.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <AddBudgetLineDialog eventSlug={eventSlug} triggerLabel="Ajouter un premier poste" />
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
              Créer rapidement un poste
            </p>
            <div className="flex flex-wrap gap-3">
              {QUICK_ADD_CATEGORIES.map((category) => (
                <AddBudgetLineDialog
                  key={category.category}
                  eventSlug={eventSlug}
                  triggerLabel={`Poste ${category.label.toLowerCase()}`}
                  triggerVariant="outline"
                  initialValues={{
                    category: category.category,
                    label: category.label,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
