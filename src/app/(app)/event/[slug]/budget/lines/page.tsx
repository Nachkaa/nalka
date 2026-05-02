import { BudgetLinesScreen } from "@/features/budget/components/budget-lines-screen";
import { getBudgetLines } from "@/features/budget/server/queries/get-budget-lines";

export default async function BudgetLinesPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const data = await getBudgetLines(slug);
  return <BudgetLinesScreen data={data} />;
}
