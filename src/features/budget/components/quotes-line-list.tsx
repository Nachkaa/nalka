import { Badge } from "@/components/ui/badge";
import { AddReceivedQuoteDialog } from "@/features/budget/components/add-received-quote-dialog";
import { AddSourcingVendorDialog } from "@/features/budget/components/add-sourcing-vendor-dialog";
import {
  formatMoney,
  getBudgetLineCategoryLabel,
  getBudgetLineSourcingStatusLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetQuotesOverviewRow, VendorOption } from "@/features/budget/lib/types";
import Link from "next/link";

export function QuotesLineList(props: {
  lines: BudgetQuotesOverviewRow[];
  vendors: VendorOption[];
  currency: string;
  eventSlug: string;
}) {
  return (
    <div className="space-y-3">
      {props.lines.map((line) => (
        <div key={line.id} className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{line.label}</h3>
                <Badge variant="outline">{getBudgetLineCategoryLabel(line.category)}</Badge>
                <Badge variant="outline">{getBudgetLineSourcingStatusLabel(line.sourcingStatus)}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Budget cible {formatMoney(line.targetAmount, props.currency)}
                {line.estimatedAmount
                  ? ` - Estimation actuelle ${formatMoney(line.estimatedAmount, props.currency)}`
                  : ""}
                {line.selectedVendorName ? ` - Retenu ${line.selectedVendorName}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">En attente {line.quoteCounts.AWAITING_RESPONSE}</Badge>
                <Badge variant="outline">Recus {line.quoteCounts.RECEIVED}</Badge>
                <Badge variant="outline">Retenus {line.quoteCounts.SELECTED}</Badge>
                <Badge variant="outline">Refuses {line.quoteCounts.REJECTED}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AddSourcingVendorDialog
                eventSlug={props.eventSlug}
                budgetLineId={line.id}
                lineLabel={line.label}
              />
              <AddReceivedQuoteDialog
                eventSlug={props.eventSlug}
                budgetLineId={line.id}
                lineLabel={line.label}
                vendors={props.vendors}
              />
              <Link
                href={`/event/${props.eventSlug}/budget/quotes/${line.id}`}
                className="text-primary text-sm font-medium"
              >
                Ouvrir le detail du devis
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
