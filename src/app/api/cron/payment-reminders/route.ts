import { NextRequest, NextResponse } from "next/server";

import { getPaymentsDueSoon } from "@/features/budget/server/queries/get-payments-due-soon";
import { sendPaymentReminderForOrganizer } from "@/features/budget/server/send-payment-reminder";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const allPayments = await getPaymentsDueSoon();

  const byOrganizer = new Map<
    string,
    { organizerEmail: string; organizerName: string | null; payments: typeof allPayments }
  >();
  for (const payment of allPayments) {
    for (const organizer of payment.organizers) {
      const entry = byOrganizer.get(organizer.id);
      if (entry) {
        entry.payments.push(payment);
      } else {
        byOrganizer.set(organizer.id, {
          organizerEmail: organizer.email,
          organizerName: organizer.name,
          payments: [payment],
        });
      }
    }
  }

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ organizerId: string; message: string }> = [];

  for (const [organizerId, { organizerEmail, organizerName, payments }] of byOrganizer) {
    try {
      const result = await sendPaymentReminderForOrganizer({
        organizerEmail,
        organizerName,
        payments,
      });

      console.log("[PAYMENT_REMINDER]", {
        organizerId,
        organizerEmail,
        paymentsCount: payments.length,
        outcome: result.sent ? "sent" : "skipped",
        ...(result.reason ? { reason: result.reason } : {}),
        sentAt: new Date().toISOString(),
      });

      if (result.sent) {
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({ organizerId, message: errorMessage });

      console.log("[PAYMENT_REMINDER]", {
        organizerId,
        organizerEmail,
        paymentsCount: payments.length,
        outcome: "error",
        errorMessage,
        sentAt: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({
    processed: byOrganizer.size,
    sent,
    skipped,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
