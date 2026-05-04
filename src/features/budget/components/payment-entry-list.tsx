import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkPaymentPaidButton } from "@/features/budget/components/mark-payment-paid-button";
import {
  formatDateTime,
  formatMoney,
  getPaymentEntryTypeLabel,
} from "@/features/budget/lib/serializers";
import type { PaymentEntrySnapshot } from "@/features/budget/lib/types";

type Props = {
  eventSlug: string;
  budgetLineId: string;
  currency: string;
  payments: PaymentEntrySnapshot[];
  title?: string;
  emptyState?: string;
};

export function PaymentEntryList(props: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title ?? "Paiements"}</CardTitle>
      </CardHeader>
      <CardContent>
        {props.payments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {props.emptyState ?? "Aucune échéance de paiement enregistrée pour le moment."}
          </p>
        ) : (
          <div className="space-y-3">
            {props.payments.map((payment) => {
              const isPaid = Boolean(payment.paidAt);

              return (
                <div
                  key={payment.id}
                  className="border-border flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{payment.label}</p>
                      <Badge variant="outline">{getPaymentEntryTypeLabel(payment.entryType)}</Badge>
                      <Badge variant={isPaid ? "secondary" : "outline"}>
                        {isPaid ? "Réglé" : "Non réglé"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <p>Montant : {formatMoney(payment.amount, props.currency)}</p>
                      <p>Échéance : {formatDateTime(payment.dueDate)}</p>
                      {isPaid && <p>Réglé le : {formatDateTime(payment.paidAt)}</p>}
                    </div>
                    {payment.note ? <p className="text-sm">{payment.note}</p> : null}
                  </div>

                  {!isPaid ? (
                    <MarkPaymentPaidButton
                      eventSlug={props.eventSlug}
                      budgetLineId={props.budgetLineId}
                      paymentEntryId={payment.id}
                      paymentLabel={payment.label}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
