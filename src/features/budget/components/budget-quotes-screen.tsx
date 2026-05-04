import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { QuotesLineList } from "@/features/budget/components/quotes-line-list";
import type { BudgetQuotesOverviewData } from "@/features/budget/lib/types";

export function BudgetQuotesScreen(props: { data: BudgetQuotesOverviewData }) {
  const hasPostes = props.data.lines.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-semibold">Devis</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {hasPostes
            ? "Ajoutez les devis reçus depuis le poste budgétaire concerné."
            : "Chaque devis est rattaché à un poste budgétaire."}
        </p>
      </div>

      {!hasPostes ? (
        <div className="space-y-4 rounded-xl border border-dashed p-8">
          <p className="text-muted-foreground text-sm">
            Créez d&apos;abord un poste budgétaire pour rattacher un devis.
          </p>
          <div className="flex flex-wrap gap-3">
            <AddBudgetLineDialog
              eventSlug={props.data.event.slug}
              triggerLabel="Créer un poste"
            />
          </div>
        </div>
      ) : (
        <div id="postes-a-quotter" className="space-y-4">
          <QuotesLineList
            lines={props.data.lines}
            vendors={props.data.vendors}
            currency={props.data.budget.currency}
            eventSlug={props.data.event.slug}
          />
        </div>
      )}
    </div>
  );
}
