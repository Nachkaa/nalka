import { z } from "zod";

export const MAX_SHARED_AMOUNT_CENTS = 100_000_000;
const id = z.string().min(1).max(100);
const amountCents = z
  .number()
  .int()
  .positive("Indiquez un montant supérieur à zéro.")
  .max(MAX_SHARED_AMOUNT_CENTS, "Le montant est trop élevé.");

export const SharedExpenseInput = z.object({
  id: z.uuid(),
  version: z.number().int().positive().optional(),
  description: z
    .string()
    .trim()
    .min(1, "Décrivez la dépense.")
    .max(160, "La description est limitée à 160 caractères."),
  amountCents,
  payerId: id,
  participantIds: z
    .array(id)
    .min(1, "Sélectionnez au moins une personne.")
    .max(200)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Une personne ne peut apparaître qu’une fois.",
    ),
});
export type SharedExpenseInput = z.infer<typeof SharedExpenseInput>;
export const SharedRepaymentInput = z
  .object({ id: z.uuid(), fromId: id, toId: id, amountCents })
  .refine((data) => data.fromId !== data.toId, "Choisissez deux personnes différentes.");
export type SharedRepaymentInput = z.infer<typeof SharedRepaymentInput>;

export function parseEuroAmount(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, cents = ""] = normalized.split(".");
  const amount = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_SHARED_AMOUNT_CENTS
    ? amount
    : null;
}

export const formatSharedMoney = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
