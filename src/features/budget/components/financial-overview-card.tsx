import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/features/budget/lib/serializers";
import type { BudgetMetricCard } from "@/features/budget/lib/types";
import { cn } from "@/lib/utils";

export function FinancialOverviewCard(props: {
  metric: BudgetMetricCard;
  currency: string;
}) {
  const displayValue =
    props.metric.displayValue ?? formatMoney(props.metric.value, props.currency);

  return (
    <Card size="sm" className="h-full">
      <CardHeader className="gap-1">
        <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
          {props.metric.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p
          className={cn(
            "text-2xl font-semibold",
            props.metric.tone === "warning" && "text-amber-700",
            props.metric.tone === "muted" && "text-muted-foreground",
          )}
        >
          {displayValue}
        </p>
        {props.metric.helper ? (
          <p className="text-muted-foreground text-sm">{props.metric.helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
