import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteDecisionActions } from "@/features/budget/components/quote-decision-actions";
import {
  formatDateTime,
  formatMoney,
  getQuoteStatusLabel,
} from "@/features/budget/lib/serializers";
import type { QuoteSnapshot } from "@/features/budget/lib/types";

export function QuoteComparisonList(props: {
  title: string;
  quotes: QuoteSnapshot[];
  currency: string;
  emptyState?: string;
  eventSlug?: string;
  budgetLineId?: string;
  actionMode?: "selected" | "received" | "awaiting" | "rejected";
  selectedQuoteId?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {props.quotes.length === 0 ? (
          <p className="text-muted-foreground text-sm">{props.emptyState ?? "Aucun devis dans cette section."}</p>
        ) : (
          <div className="space-y-4">
            {props.quotes.map((quote) => (
              <div key={quote.id} className="border-border rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{quote.vendorName}</h3>
                  <Badge variant="outline">{getQuoteStatusLabel(quote.status)}</Badge>
                  {quote.amount ? <Badge variant="outline">{formatMoney(quote.amount, props.currency)}</Badge> : null}
                </div>
                <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                  <p>Demande le : {formatDateTime(quote.requestedAt)}</p>
                  <p>Recu le : {formatDateTime(quote.receivedAt)}</p>
                  <p>Valable jusqu&apos;au : {formatDateTime(quote.validUntil)}</p>
                </div>
                {quote.scope ? <p className="mt-3 text-sm">{quote.scope}</p> : null}
                {quote.decisionNote ? (
                  <p className="text-muted-foreground mt-3 text-sm">Note de decision : {quote.decisionNote}</p>
                ) : null}
                {quote.internalNote ? (
                  <p className="text-muted-foreground mt-1 text-sm">Note interne : {quote.internalNote}</p>
                ) : null}
                {props.eventSlug && props.budgetLineId ? (
                  <QuoteDecisionActions
                    eventSlug={props.eventSlug}
                    budgetLineId={props.budgetLineId}
                    quote={quote}
                    allowSelect={props.actionMode === "received"}
                    allowReject={props.actionMode === "received"}
                    isSelected={props.selectedQuoteId === quote.id}
                  />
                ) : null}
                {quote.attachments.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {quote.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a href={attachment.fileUrl} className="text-primary" target="_blank" rel="noreferrer">
                          {attachment.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
