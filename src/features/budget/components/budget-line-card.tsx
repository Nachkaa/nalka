import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  getBudgetLineCategoryLabel,
  getBudgetLineSourcingStatusLabel,
  getBudgetPaymentStatusLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetLineRow } from "@/features/budget/lib/types";
import Link from "next/link";

export function BudgetLineCard(props: {
  line: BudgetLineRow;
  currency: string;
  eventSlug: string;
}) {
  const { line, currency, eventSlug } = props;

  const remainingToPay =
    line.sourcingStatus === "BOOKED" && Number(line.paidAmount) > 0
      ? (Number(line.committedAmount) - Number(line.paidAmount)).toFixed(2)
      : null;

  const ctaLabel =
    line.sourcingStatus === "DRAFT" ? "Démarrer la consultation" : "Voir les devis →";

  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <div className="mb-3">
        <h3 className="font-medium">{line.label}</h3>
        <p className="text-muted-foreground text-xs">
          {getBudgetLineCategoryLabel(line.category)}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Cible</span>
        <span className="tabular-nums">{formatMoney(line.targetAmount, currency)}</span>

        <span className="text-muted-foreground">Engagé</span>
        <span className="tabular-nums">{formatMoney(line.committedAmount, currency)}</span>

        {remainingToPay !== null && (
          <>
            <span className="text-muted-foreground">Reste à régler</span>
            <span className="tabular-nums">{formatMoney(remainingToPay, currency)}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">{getBudgetLineSourcingStatusLabel(line.sourcingStatus)}</Badge>
        <Badge variant="outline">{getBudgetPaymentStatusLabel(line.paymentStatus)}</Badge>
      </div>

      <div className="mt-3">
        <Link
          href={`/event/${eventSlug}/budget/quotes/${line.id}`}
          className="text-primary text-sm font-medium"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
