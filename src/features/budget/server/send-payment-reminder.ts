import { render } from "@react-email/render";

import { PaymentReminderEmail } from "@/emails/PaymentReminderEmail";
import { BUDGET_DEFAULT_CURRENCY } from "@/features/budget/lib/constants";
import {
  formatMoney,
  formatShortDate,
  serializeDateValue,
  serializeMoneyValue,
} from "@/features/budget/lib/serializers";
import type { PaymentWithContext } from "@/features/budget/server/queries/get-payments-due-soon";
import { sendMail } from "@/lib/mail";

export async function sendPaymentReminderForOrganizer(args: {
  organizerEmail: string;
  organizerName: string | null;
  payments: PaymentWithContext[];
}): Promise<{ sent: boolean; reason?: string }> {
  const { organizerEmail, organizerName, payments } = args;

  if (payments.length === 0) {
    return { sent: false, reason: "no payments due" };
  }

  const byEvent = new Map<
    string,
    { eventTitle: string; eventSlug: string; payments: PaymentWithContext[] }
  >();
  for (const payment of payments) {
    const entry = byEvent.get(payment.event.id);
    if (entry) {
      entry.payments.push(payment);
    } else {
      byEvent.set(payment.event.id, {
        eventTitle: payment.event.title,
        eventSlug: payment.event.slug,
        payments: [payment],
      });
    }
  }

  const reminders = Array.from(byEvent.values()).map((group) => ({
    eventTitle: group.eventTitle,
    eventSlug: group.eventSlug,
    payments: group.payments.map((p) => ({
      label: p.paymentLabel,
      vendorName: p.vendorName,
      lineName: p.lineName,
      amount: formatMoney(serializeMoneyValue(p.amount), BUDGET_DEFAULT_CURRENCY),
      dueDate: formatShortDate(serializeDateValue(p.dueDate)),
      daysUntilDue: p.daysUntilDue,
    })),
  }));

  const appUrl = process.env.AUTH_URL ?? "";
  const displayName = organizerName ?? organizerEmail;
  const totalCount = payments.length;

  const html = await render(
    PaymentReminderEmail({
      organizerName: displayName,
      appUrl,
      reminders,
      unsubscribeNote:
        "Vous recevez cet email en tant qu'organisateur d'un événement Nalka.",
    }),
  );

  await sendMail({
    to: organizerEmail,
    subject: `Rappel : ${totalCount} paiement${totalCount > 1 ? "s" : ""} à régler prochainement`,
    html,
  });

  return { sent: true };
}
