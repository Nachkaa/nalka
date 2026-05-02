import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { BudgetLinesView } from "@/features/budget/components/budget-lines-view";
import type { BudgetLinesData } from "@/features/budget/lib/types";

export function BudgetLinesScreen(props: { data: BudgetLinesData }) {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-semibold">Postes budgetaires</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Chaque poste correspond a une grande depense : lieu, restauration, decoration,
          animation...
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Suivez chaque poste, son budget cible, son estimation actuelle, son retenu et son
          avancement de paiement.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Tous les postes budgetaires</CardTitle>
          <AddBudgetLineDialog eventSlug={props.data.event.slug} />
        </CardHeader>
        <CardContent>
          {props.data.lines.length === 0 ? (
            <div className="space-y-4 rounded-xl border border-dashed p-8">
              <p className="text-muted-foreground text-sm">
                Aucun poste budgetaire pour le moment. Ajoutez-en un premier pour commencer a
                suivre vos depenses.
              </p>
              <AddBudgetLineDialog eventSlug={props.data.event.slug} />
            </div>
          ) : (
            <BudgetLinesView
              lines={props.data.lines}
              currency={props.data.budget.currency}
              eventSlug={props.data.event.slug}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
