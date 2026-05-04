import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPaymentEntryDialog } from "@/features/budget/components/add-payment-entry-dialog";
import { AddReceivedQuoteDialog } from "@/features/budget/components/add-received-quote-dialog";
import { AddSourcingVendorDialog } from "@/features/budget/components/add-sourcing-vendor-dialog";
import { MarkLineBookedButton } from "@/features/budget/components/mark-line-booked-button";
import { PaymentEntryList } from "@/features/budget/components/payment-entry-list";
import { QuoteComparisonList } from "@/features/budget/components/quote-comparison-list";
import { ReopenSelectedLineButton } from "@/features/budget/components/reopen-selected-line-button";
import {
  formatMoney,
  formatShortDate,
  getBudgetLineCategoryLabel,
  getBudgetLineSourcingStatusLabel,
  getBudgetPaymentStatusLabel,
} from "@/features/budget/lib/serializers";
import type { BudgetLineQuotesData } from "@/features/budget/lib/types";

export function BudgetLineQuotesScreen(props: { data: BudgetLineQuotesData }) {
  const { line } = props.data;
  const canManageSourcing = line.sourcingStatus !== "BOOKED";

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold">{line.label}</h2>
          <Badge variant="outline">{getBudgetLineCategoryLabel(line.category)}</Badge>
          <Badge variant="outline">{getBudgetLineSourcingStatusLabel(line.sourcingStatus)}</Badge>
          <Badge variant="outline">{getBudgetPaymentStatusLabel(line.paymentStatus)}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageSourcing ? (
            <AddSourcingVendorDialog
              eventSlug={props.data.event.slug}
              budgetLineId={line.id}
              lineLabel={line.label}
            />
          ) : null}
          {canManageSourcing ? (
            <AddReceivedQuoteDialog
              eventSlug={props.data.event.slug}
              budgetLineId={line.id}
              lineLabel={line.label}
              vendors={props.data.vendors}
            />
          ) : null}
          {line.sourcingStatus === "SELECTED" ? (
            <MarkLineBookedButton
              eventSlug={props.data.event.slug}
              budgetLineId={line.id}
              lineLabel={line.label}
            />
          ) : null}
          {line.sourcingStatus === "SELECTED" && line.selectedQuoteId ? (
            <ReopenSelectedLineButton
              eventSlug={props.data.event.slug}
              budgetLineId={line.id}
              selectedQuoteId={line.selectedQuoteId}
              lineLabel={line.label}
            />
          ) : null}
          {line.sourcingStatus === "BOOKED" ? (
            <AddPaymentEntryDialog
              eventSlug={props.data.event.slug}
              budgetLineId={line.id}
              lineLabel={line.label}
              selectedQuoteId={line.selectedQuoteId}
            />
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Budget prévu {formatMoney(line.targetAmount, props.data.budget.currency)}
          {line.estimatedAmount
            ? ` - Coût estimé ${formatMoney(line.estimatedAmount, props.data.budget.currency)}`
            : ""}
          {line.varianceAmount ? ` - Écart ${formatMoney(line.varianceAmount, props.data.budget.currency)}` : ""}
        </p>
      </div>

      {line.selectedQuote ? (
        <QuoteComparisonList
          title="Devis retenu"
          quotes={[line.selectedQuote]}
          currency={props.data.budget.currency}
          eventSlug={props.data.event.slug}
          budgetLineId={line.id}
          actionMode="selected"
          selectedQuoteId={line.selectedQuoteId}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <QuoteComparisonList
          title="Devis reçus à comparer"
          quotes={line.receivedQuotes}
          currency={props.data.budget.currency}
          emptyState="Aucun devis reçu pour le moment."
          eventSlug={props.data.event.slug}
          budgetLineId={line.id}
          actionMode="received"
          selectedQuoteId={line.selectedQuoteId}
        />
        <QuoteComparisonList
          title="En attente de réponse"
          quotes={line.awaitingResponseQuotes}
          currency={props.data.budget.currency}
          emptyState="Aucun fournisseur en attente de réponse pour le moment."
          actionMode="awaiting"
        />
      </div>

      <QuoteComparisonList
        title="Devis refusés"
        quotes={line.rejectedQuotes}
        currency={props.data.budget.currency}
        actionMode="rejected"
      />

      <Card>
        <CardHeader>
          <CardTitle>Détail du poste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Retenu :</span>{" "}
            {formatMoney(line.committedAmount, props.data.budget.currency)}
          </p>
          <p>
            <span className="text-muted-foreground">Réglé :</span>{" "}
            {formatMoney(line.paidAmount, props.data.budget.currency)}
          </p>
          <p>
            <span className="text-muted-foreground">Pièces jointes :</span> {line.allAttachments.length}
          </p>
          <p>
            <span className="text-muted-foreground">Prochain paiement :</span>{" "}
            {line.nextPaymentDue ? formatShortDate(line.nextPaymentDue) : "Aucun paiement en attente"}
          </p>
          {line.internalNote ? (
            <p>
              <span className="text-muted-foreground">Note interne :</span> {line.internalNote}
            </p>
          ) : null}
          {line.sourcingStatus === "SELECTED" ? (
            <p className="text-muted-foreground">
              Vous pouvez rouvrir l&apos;évaluation si vous souhaitez comparer les devis à nouveau.
            </p>
          ) : null}
          {!canManageSourcing ? (
            <p className="text-muted-foreground">
              Cette ligne est déjà réservée. Vous pouvez encore suivre les paiements ci-dessous.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {line.sourcingStatus === "BOOKED" || line.paymentEntries.length > 0 ? (
        <PaymentEntryList
          eventSlug={props.data.event.slug}
          budgetLineId={line.id}
          currency={props.data.budget.currency}
          payments={line.paymentEntries}
          title="Paiements prévus"
          emptyState="Aucune échéance de paiement enregistrée pour le moment."
        />
      ) : null}
    </div>
  );
}
