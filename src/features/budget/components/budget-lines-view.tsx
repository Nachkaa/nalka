import { BudgetLineCard } from "@/features/budget/components/budget-line-card";
import { BudgetLinesTable } from "@/features/budget/components/budget-lines-table";
import type { BudgetLineRow } from "@/features/budget/lib/types";

export function BudgetLinesView(props: {
  lines: BudgetLineRow[];
  currency: string;
  eventSlug: string;
}) {
  return (
    <>
      <div className="block space-y-3 md:hidden">
        {props.lines.map((line) => (
          <BudgetLineCard
            key={line.id}
            line={line}
            currency={props.currency}
            eventSlug={props.eventSlug}
          />
        ))}
      </div>
      <div className="hidden md:block">
        <BudgetLinesTable
          lines={props.lines}
          currency={props.currency}
          eventSlug={props.eventSlug}
        />
      </div>
    </>
  );
}
