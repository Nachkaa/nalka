"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { BudgetTotalSetupCard } from "@/features/budget/components/budget-total-setup-card";
import {
  formatMoney,
  getBudgetLineCategoryLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetEntryStateData } from "@/features/budget/lib/types";

type Props = {
  data: BudgetEntryStateData;
};

export function BudgetStructureScreen({ data }: Props) {
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);

  const budgetLabel = useMemo(
    () => formatMoney(data.budget.totalBudget, data.budget.currency),
    [data.budget.currency, data.budget.totalBudget],
  );
  const quotesHref =
    data.linesCount === 1 && data.previewLines[0]
      ? `/event/${data.event.slug}/budget/quotes/${data.previewLines[0].id}`
      : `/event/${data.event.slug}/budget/quotes`;

  return (
    <div className="space-y-6 pb-10">
      {data.hasDefinedTotal ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget global</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-2xl font-semibold">{budgetLabel}</p>
            <p className="text-muted-foreground text-sm">
              {data.linesCount} {data.linesCount > 1 ? "postes créés" : "poste créé"}
            </p>
          </CardContent>
        </Card>
      ) : showBudgetSetup ? (
        <BudgetTotalSetupCard
          eventSlug={data.event.slug}
          title="Définir le budget global"
          intro="Vous pouvez continuer à structurer le budget et définir le budget global plus tard."
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
              Le budget commence à être structuré. Vous pourrez définir le budget global plus tard.
            </p>
            <Button type="button" variant="outline" onClick={() => setShowBudgetSetup(true)}>
              Définir maintenant
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Structurez votre budget</CardTitle>
          <p className="text-muted-foreground text-sm">
            Vous avez commencé à organiser le budget. Ajoutez encore des postes ou commencez à
            comparer des devis pour obtenir une vue plus utile.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <AddBudgetLineDialog eventSlug={data.event.slug} triggerLabel="Ajouter un autre poste" />
              <Button type="button" variant="outline" asChild>
                <Link href={quotesHref}>Ajouter un premier devis</Link>
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                Postes actuels
              </p>
            </div>
            <div className="space-y-3">
              {data.previewLines.map((line) => (
                <div key={line.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                      {getBudgetLineCategoryLabel(line.category)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{line.label}</h3>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>Budget prévu {formatMoney(line.targetAmount, data.budget.currency)}</span>
                    {line.estimatedAmount ? (
                      <span>
                        Coût estimé {formatMoney(line.estimatedAmount, data.budget.currency)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-dashed p-4">
            <p className="text-sm font-medium">Pour aller plus loin</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Chaque devis est rattaché à un poste budgétaire. La vue d&apos;ensemble devient plus
              utile dès que vous ajoutez une estimation, un devis ou un paiement.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
