import { AddPaymentEntryDialog } from "@/features/budget/components/add-payment-entry-dialog";
import { PaymentEntryList } from "@/features/budget/components/payment-entry-list";
import {
  formatMoney,
  formatShortDate,
  getBudgetPaymentStatusLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetLineRow } from "@/features/budget/lib/types";
import Link from "next/link";

export function BudgetLineExpandedRow(props: {
  line: BudgetLineRow;
  currency: string;
  eventSlug: string;
}) {
  const paidValue = Number(props.line.paidAmount);
  const committedValue = Number(props.line.committedAmount);
  const progress = committedValue > 0 ? Math.min(100, Math.round((paidValue / committedValue) * 100)) : 0;

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Fournisseur retenu</p>
          <p className="mt-1 font-medium">{props.line.selectedVendorName ?? "Aucun fournisseur retenu"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Devis recus</p>
          <p className="mt-1 font-medium">{props.line.quotesReceivedCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Pieces jointes</p>
          <p className="mt-1 font-medium">{props.line.attachmentsCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Prochain paiement</p>
          <p className="mt-1 font-medium">
            {props.line.nextPaymentDue ? formatShortDate(props.line.nextPaymentDue) : "Aucun paiement en attente"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Avancement des paiements</p>
          <p className="mt-1 font-medium">
            {formatMoney(props.line.paidAmount, props.currency)} /{" "}
            {formatMoney(props.line.committedAmount, props.currency)}
          </p>
          <p className="text-muted-foreground text-sm">
            {progress}% - {getBudgetPaymentStatusLabel(props.line.paymentStatus)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {props.line.internalNote ? props.line.internalNote : "Aucune note interne pour le moment."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {props.line.sourcingStatus === "BOOKED" ? (
            <AddPaymentEntryDialog
              eventSlug={props.eventSlug}
              budgetLineId={props.line.id}
              lineLabel={props.line.label}
              selectedQuoteId={props.line.selectedQuoteId}
            />
          ) : null}
          <Link
            href={`/event/${props.eventSlug}/budget/quotes/${props.line.id}`}
            className="text-primary text-sm font-medium"
          >
            Ouvrir le detail du devis
          </Link>
        </div>
      </div>

      {props.line.sourcingStatus === "BOOKED" || props.line.paymentEntries.length > 0 ? (
        <div className="mt-4">
          <PaymentEntryList
            eventSlug={props.eventSlug}
            budgetLineId={props.line.id}
            currency={props.currency}
            payments={props.line.paymentEntries}
            title="Paiements"
            emptyState="Aucune echeance de paiement enregistree pour le moment."
          />
        </div>
      ) : null}
    </div>
  );
}
