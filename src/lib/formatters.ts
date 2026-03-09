// src/lib/formatters.ts

/**
 * Formatte une date JS en "26 novembre 2025"
 */
export function fmtDate(date: Date): string {
  try {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Formatte un montant en centimes -> "45,00 €"
 */
export function fmtEUR(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents)) return "";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });
}
