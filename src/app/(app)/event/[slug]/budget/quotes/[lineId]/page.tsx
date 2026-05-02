import { BudgetLineQuotesScreen } from "@/features/budget/components/budget-line-quotes-screen";
import { getBudgetLineQuotes } from "@/features/budget/server/queries/get-budget-line-quotes";

export default async function BudgetLineQuotesPage(props: {
  params: Promise<{ slug: string; lineId: string }>;
}) {
  const { slug, lineId } = await props.params;
  const data = await getBudgetLineQuotes(slug, lineId);
  return <BudgetLineQuotesScreen data={data} />;
}
