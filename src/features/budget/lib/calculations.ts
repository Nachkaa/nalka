import type {
  BudgetLineSourcingStatus,
  BudgetMoneyValue,
  BudgetPaymentStatus,
  PaymentEntrySnapshot,
} from "@/features/budget/lib/types";

function toCents(value: BudgetMoneyValue | null | undefined) {
  if (!value) return 0;
  return Math.round(Number(value) * 100);
}

function fromCents(value: number) {
  return (value / 100).toFixed(2);
}

export function sumMoney(values: Array<BudgetMoneyValue | null | undefined>) {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}

export function subtractMoney(left: BudgetMoneyValue, right: BudgetMoneyValue) {
  return fromCents(toCents(left) - toCents(right));
}

export function compareMoney(left: BudgetMoneyValue | null | undefined, right: BudgetMoneyValue | null | undefined) {
  return toCents(left) - toCents(right);
}

export function calculateVariance(
  estimatedAmount: BudgetMoneyValue | null,
  targetAmount: BudgetMoneyValue,
) {
  if (!estimatedAmount) return null;
  return fromCents(toCents(estimatedAmount) - toCents(targetAmount));
}

export function calculateCommittedAmount(args: {
  sourcingStatus: BudgetLineSourcingStatus;
  selectedQuoteAmount: BudgetMoneyValue | null;
}) {
  if (args.sourcingStatus !== "SELECTED" && args.sourcingStatus !== "BOOKED") {
    return "0.00";
  }

  if (!args.selectedQuoteAmount) {
    return "0.00";
  }

  return fromCents(toCents(args.selectedQuoteAmount));
}

export function calculatePaidAmount(paymentEntries: PaymentEntrySnapshot[]) {
  return fromCents(
    paymentEntries.reduce((total, payment) => {
      if (!payment.paidAt) return total;
      return total + toCents(payment.amount);
    }, 0),
  );
}

export function derivePaymentStatus(args: {
  committedAmount: BudgetMoneyValue;
  paidAmount: BudgetMoneyValue;
  paymentEntries: PaymentEntrySnapshot[];
}): BudgetPaymentStatus {
  const committedCents = toCents(args.committedAmount);
  const paidCents = toCents(args.paidAmount);

  if (committedCents <= 0) {
    return "NOT_APPLICABLE";
  }

  if (paidCents <= 0) {
    return "UNPAID";
  }

  if (paidCents >= committedCents) {
    return "PAID";
  }

  const hasPaidDeposit = args.paymentEntries.some(
    (payment) => payment.entryType === "DEPOSIT" && payment.paidAt,
  );

  return hasPaidDeposit ? "DEPOSIT_PAID" : "PARTIALLY_PAID";
}
