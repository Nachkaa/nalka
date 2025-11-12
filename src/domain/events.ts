import { z } from "zod";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const EventCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable().transform((v) => v || null),
  date: z.union([z.string(), z.date()])
    .transform((v) => new Date(v as string))
    .refine((d) => d >= startOfToday(), {
      message: "La date doit être aujourd’hui ou plus tard.",
    }),
  location: z.string().max(120).optional().nullable().transform((v) => v || null),

  // booleans envoyés via hidden input "true" | ""
  isNoSpoil: z.coerce.boolean().default(false),
  isAnonReservations: z.coerce.boolean().default(false),
  isSecondHandOk: z.coerce.boolean().default(false),
  isHandmadeOk: z.coerce.boolean().default(false),
  isSecretSanta: z.coerce.boolean().default(false),

  // budget en euros -> cents ou null
  budgetCap: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return null;
      const n = Number.parseFloat(s.replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
    }),
}).transform((d) => {
  // Secret Santa force les règles de visibilité
  if (d.isSecretSanta) {
    d.isNoSpoil = true;
    d.isAnonReservations = true;
  }
  return d;
});