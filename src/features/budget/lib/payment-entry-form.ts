import { z } from "zod";

export const createPaymentEntrySchema = z.object({
  eventSlug: z.string().trim().min(1),
  budgetLineId: z.string().trim().min(1, "La ligne budgetaire est requise"),
  quoteId: z.string().trim().optional().transform((value) => value ?? ""),
  label: z.string().trim().min(1, "Le libelle est requis"),
  entryType: z.enum(["DEPOSIT", "BALANCE", "OTHER"], {
    message: "Le type d'echeance est requis",
  }),
  amount: z
    .string()
    .trim()
    .min(1, "Le montant est requis")
    .refine((value) => !Number.isNaN(Number(value)), "Le montant doit etre valide")
    .refine((value) => Number(value) > 0, "Le montant doit etre superieur a 0"),
  dueDate: z
    .string()
    .trim()
    .min(1, "La date d'echeance est requise")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "La date doit etre valide"),
  note: z.string().trim().optional().transform((value) => value ?? ""),
});

export const markPaymentEntryPaidSchema = z.object({
  eventSlug: z.string().trim().min(1),
  budgetLineId: z.string().trim().min(1),
  paymentEntryId: z.string().trim().min(1, "L'echeance de paiement est requise"),
  paidAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), "La date doit etre valide"),
});

export const markLineBookedSchema = z.object({
  eventSlug: z.string().trim().min(1),
  budgetLineId: z.string().trim().min(1, "La ligne budgetaire est requise"),
});

export type BudgetPaymentMutationResult = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<"quoteId" | "label" | "entryType" | "amount" | "dueDate" | "note" | "paidAt", string>
  >;
};

export function normalizeMoneyInput(value: string) {
  return Number(value).toFixed(2);
}

export function normalizeOptionalString(value: string) {
  return value ? value : null;
}

export function normalizeOptionalDateValue(value: string) {
  return value ? new Date(value) : null;
}
