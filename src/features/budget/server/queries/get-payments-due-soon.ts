import { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const halfDayMs = 12 * 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

function targetWindow(daysUntilDue: 7 | 1) {
  const now = new Date();
  const target = now.getTime() + daysUntilDue * dayMs;
  return {
    gte: new Date(target - halfDayMs),
    lte: new Date(target + halfDayMs),
  };
}

export type PaymentWithContext = {
  paymentId: string;
  paymentLabel: string;
  amount: { toString(): string };
  dueDate: Date;
  daysUntilDue: 7 | 1;
  lineName: string;
  vendorName: string | null;
  event: { id: string; title: string; slug: string };
  organizers: Array<{ id: string; email: string; name: string | null }>;
};

export async function getPaymentsDueSoon(): Promise<PaymentWithContext[]> {
  const window7 = targetWindow(7);
  const window1 = targetWindow(1);

  const payments = await prisma.paymentEntry.findMany({
    where: {
      paidAt: null,
      OR: [{ dueDate: window7 }, { dueDate: window1 }],
    },
    include: {
      budgetLine: {
        include: {
          budget: {
            include: {
              event: {
                include: {
                  memberships: {
                    where: {
                      role: { in: [EventMemberRole.OWNER, EventMemberRole.ADMIN] },
                    },
                    include: {
                      user: { select: { id: true, email: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      quote: {
        include: { vendor: { select: { name: true } } },
      },
    },
  });

  return payments.flatMap((payment) => {
    const event = payment.budgetLine.budget.event;
    const organizers = event.memberships
      .filter((m) => m.user.email !== null)
      .map((m) => ({
        id: m.user.id,
        email: m.user.email!,
        name: m.user.name,
      }));

    if (organizers.length === 0) return [];

    const inWindow7 = payment.dueDate >= window7.gte && payment.dueDate <= window7.lte;

    return [
      {
        paymentId: payment.id,
        paymentLabel: payment.label,
        amount: payment.amount,
        dueDate: payment.dueDate,
        daysUntilDue: (inWindow7 ? 7 : 1) as 7 | 1,
        lineName: payment.budgetLine.label,
        vendorName: payment.quote?.vendor?.name ?? null,
        event: { id: event.id, title: event.title, slug: event.slug },
        organizers,
      },
    ];
  });
}
