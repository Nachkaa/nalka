import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatShortDate } from "@/features/budget/lib/serializers";
import type { UpcomingPaymentItem } from "@/features/budget/lib/types";
import Link from "next/link";

export function UpcomingPaymentsList(props: {
  items: UpcomingPaymentItem[];
  currency: string;
  eventSlug: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiements a venir</CardTitle>
      </CardHeader>
      <CardContent>
        {props.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun paiement en attente pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {props.items.map((item) => (
              <li key={item.id} className="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <p className="font-medium">{item.paymentLabel}</p>
                  <p className="text-muted-foreground text-sm">
                    {item.lineLabel}
                    {item.vendorName ? ` - ${item.vendorName}` : ""}
                  </p>
                  <p className="text-muted-foreground text-sm">Echeance {formatShortDate(item.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(item.amount, props.currency)}</p>
                  <Link
                    href={`/event/${props.eventSlug}/budget/quotes/${item.lineId}`}
                    className="text-primary mt-2 inline-flex text-sm font-medium"
                  >
                    Voir la ligne
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
