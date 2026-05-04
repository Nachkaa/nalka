import { Badge } from "@/components/ui/badge";
import { AddPaymentEntryDialog } from "@/features/budget/components/add-payment-entry-dialog";
import { BudgetLineExpandedRow } from "@/features/budget/components/budget-line-expanded-row";
import { EditBudgetLineDialog } from "@/features/budget/components/edit-budget-line-dialog";
import {
  formatMoney,
  getBudgetLineCategoryLabel,
  getBudgetLineSourcingStatusLabel,
  getBudgetPaymentStatusLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetLineRow } from "@/features/budget/lib/types";
import { Fragment } from "react";

export function BudgetLinesTable(props: {
  lines: BudgetLineRow[];
  currency: string;
  eventSlug: string;
}) {
  const expandedLineId = props.lines[0]?.id ?? null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
        <thead>
          <tr className="text-muted-foreground text-left text-xs uppercase tracking-[0.12em]">
            <th className="px-3 py-2 font-medium">Poste budgétaire</th>
            <th className="px-3 py-2 font-medium">Budget prévu</th>
            <th className="px-3 py-2 font-medium">Coût estimé</th>
            <th className="px-3 py-2 font-medium">Engagé</th>
            <th className="px-3 py-2 font-medium">Payé</th>
            <th className="px-3 py-2 font-medium">Écart</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.lines.map((line) => (
            <Fragment key={line.id}>
              <tr className="bg-card border-border rounded-xl border shadow-sm">
                <td className="rounded-l-xl px-3 py-4 align-top">
                  <div className="space-y-1">
                    <p className="font-medium">{line.label}</p>
                    <p className="text-muted-foreground text-sm">{getBudgetLineCategoryLabel(line.category)}</p>
                  </div>
                </td>
                <td className="px-3 py-4 align-top font-medium">{formatMoney(line.targetAmount, props.currency)}</td>
                <td className="px-3 py-4 align-top">
                  {line.estimatedAmount ? formatMoney(line.estimatedAmount, props.currency) : "Aucune estimation"}
                </td>
                <td className="px-3 py-4 align-top">{formatMoney(line.committedAmount, props.currency)}</td>
                <td className="px-3 py-4 align-top">{formatMoney(line.paidAmount, props.currency)}</td>
                <td className="px-3 py-4 align-top">
                  {line.varianceAmount ? formatMoney(line.varianceAmount, props.currency) : "Pas encore d'écart"}
                </td>
                <td className="px-3 py-4 align-top">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">Devis :</span>
                      <Badge variant="outline">{getBudgetLineSourcingStatusLabel(line.sourcingStatus)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">Paiement :</span>
                      <Badge variant="outline">{getBudgetPaymentStatusLabel(line.paymentStatus)}</Badge>
                    </div>
                  </div>
                </td>
                <td className="rounded-r-xl px-3 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <EditBudgetLineDialog eventSlug={props.eventSlug} line={line} />
                    {line.sourcingStatus === "BOOKED" ? (
                      <AddPaymentEntryDialog
                        eventSlug={props.eventSlug}
                        budgetLineId={line.id}
                        lineLabel={line.label}
                        selectedQuoteId={line.selectedQuoteId}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
              {expandedLineId === line.id ? (
                <tr>
                  <td colSpan={8} className="px-3 pb-2">
                    <BudgetLineExpandedRow line={line} currency={props.currency} eventSlug={props.eventSlug} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
