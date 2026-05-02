import { z } from "zod";

export const quoteDecisionSchema = z.object({
  eventSlug: z.string().trim().min(1),
  budgetLineId: z.string().trim().min(1),
  quoteId: z.string().trim().min(1, "Le devis est requis"),
  decisionNote: z.string().trim().optional().transform((value) => value ?? ""),
});

export type QuoteDecisionResult = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"quoteId" | "decisionNote", string>>;
};
