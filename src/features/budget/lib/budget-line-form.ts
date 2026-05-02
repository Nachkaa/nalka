import {
  BUDGET_LINE_CATEGORY_OPTIONS,
  EDITABLE_BUDGET_LINE_SOURCING_STATUSES,
} from "@/features/budget/lib/constants";
import { z } from "zod";

const moneyStringSchema = z
  .string()
  .trim()
  .min(1, "Champ requis")
  .refine((value) => !Number.isNaN(Number(value)), "Le montant doit etre valide")
  .refine((value) => Number(value) >= 0, "Le montant doit etre superieur ou egal a 0");

const optionalMoneyStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value === "" || !Number.isNaN(Number(value)), "Le montant doit etre valide")
  .refine((value) => value === "" || Number(value) >= 0, "Le montant doit etre superieur ou egal a 0");

export const createBudgetLineSchema = z.object({
  eventSlug: z.string().trim().min(1),
  category: z.enum(BUDGET_LINE_CATEGORY_OPTIONS, { message: "Categorie invalide" }),
  label: z.string().trim().min(1, "Le libelle est requis"),
  targetAmount: moneyStringSchema,
  estimatedAmount: optionalMoneyStringSchema,
  internalNote: z.string().trim().optional().transform((value) => value ?? ""),
});

export const updateBudgetLineSchema = createBudgetLineSchema.extend({
  budgetLineId: z.string().trim().min(1),
  sourcingStatus: z.enum(EDITABLE_BUDGET_LINE_SOURCING_STATUSES, {
    message: "Statut de consultation invalide",
  }),
});

export type CreateBudgetLineInput = z.infer<typeof createBudgetLineSchema>;
export type UpdateBudgetLineInput = z.infer<typeof updateBudgetLineSchema>;

export type BudgetLineMutationResult = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"category" | "label" | "targetAmount" | "estimatedAmount" | "internalNote" | "sourcingStatus", string>>;
};

export function normalizeMoneyInput(value: string) {
  return Number(value).toFixed(2);
}
