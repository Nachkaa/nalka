import { BudgetFirstPostesScreen } from "@/features/budget/components/budget-first-postes-screen";
import { BudgetStructureScreen } from "@/features/budget/components/budget-structure-screen";
import { BudgetSummaryScreen } from "@/features/budget/components/budget-summary-screen";
import { BudgetTotalSetupCard } from "@/features/budget/components/budget-total-setup-card";
import { getBudgetEntryState } from "@/features/budget/server/queries/get-budget-entry-state";
import { getBudgetSummary } from "@/features/budget/server/queries/get-budget-summary";

export default async function BudgetSummaryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const entryState = await getBudgetEntryState(slug);

  if (entryState.budget.setupStatus === "NOT_STARTED" && entryState.linesCount === 0) {
    return (
      <div className="pb-10">
        <BudgetTotalSetupCard
          eventSlug={slug}
          title="Commencer le budget"
          intro="Definis un budget global, puis ajoute tes premiers postes pour suivre les depenses et comparer les devis."
          allowSkip
        />
      </div>
    );
  }

  if (entryState.linesCount === 0) {
    return (
      <BudgetFirstPostesScreen
        eventSlug={slug}
        currency={entryState.budget.currency}
        totalBudget={entryState.budget.totalBudget}
        hasDefinedTotal={entryState.hasDefinedTotal}
      />
    );
  }

  if (
    entryState.linesCount > 0 &&
    entryState.estimatedLinesCount === 0 &&
    entryState.quotesCount === 0 &&
    entryState.paymentsCount === 0
  ) {
    return <BudgetStructureScreen data={entryState} />;
  }

  const data = await getBudgetSummary(slug);
  return <BudgetSummaryScreen data={data} />;
}
