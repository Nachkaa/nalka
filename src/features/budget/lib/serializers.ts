import {
  BUDGET_LINE_CATEGORY_LABELS,
  BUDGET_LINE_SOURCING_STATUS_LABELS,
  BUDGET_PAYMENT_STATUS_LABELS,
  PAYMENT_ENTRY_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
} from "@/features/budget/lib/constants";
import type {
  BudgetLineCategory,
  BudgetLineSourcingStatus,
  BudgetMoneyValue,
  BudgetPaymentStatus,
  PaymentEntryType,
  QuoteStatus,
} from "@/features/budget/lib/types";

type DecimalLike = { toString(): string } | string | number | null | undefined;

export function serializeMoneyValue(value: DecimalLike): BudgetMoneyValue {
  if (value === null || value === undefined) return "0.00";
  const numericValue = typeof value === "number" ? value : Number(value.toString());
  return numericValue.toFixed(2);
}

export function serializeNullableMoneyValue(value: DecimalLike) {
  if (value === null || value === undefined) return null;
  return serializeMoneyValue(value);
}

export function serializeDateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export function formatMoney(value: BudgetMoneyValue, currency = "EUR", locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function formatShortDate(value: string | null, locale = "fr-FR") {
  if (!value) return "Aucune";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null, locale = "fr-FR") {
  if (!value) return "Aucune";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getBudgetLineCategoryLabel(value: BudgetLineCategory) {
  return BUDGET_LINE_CATEGORY_LABELS[value];
}

export function getBudgetLineSourcingStatusLabel(value: BudgetLineSourcingStatus) {
  return BUDGET_LINE_SOURCING_STATUS_LABELS[value];
}

export function getQuoteStatusLabel(value: QuoteStatus) {
  return QUOTE_STATUS_LABELS[value];
}

export function getPaymentEntryTypeLabel(value: PaymentEntryType) {
  return PAYMENT_ENTRY_TYPE_LABELS[value];
}

export function getBudgetPaymentStatusLabel(value: BudgetPaymentStatus) {
  return BUDGET_PAYMENT_STATUS_LABELS[value];
}
