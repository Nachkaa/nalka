import { BudgetQuotesScreen } from "@/features/budget/components/budget-quotes-screen";
import { getBudgetQuotesOverview } from "@/features/budget/server/queries/get-budget-quotes-overview";

export default async function BudgetQuotesPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const data = await getBudgetQuotesOverview(slug);
  return <BudgetQuotesScreen data={data} />;
}
