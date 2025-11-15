import { z } from "zod";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const checkboxFromForm = z
  .any()
  .transform((v) => {
    // Accepte "true", "false", "on", true, false, null, undefined…
    if (v === "true" || v === true || v === "on") return true;
    return false;
  });

const giftModeFromForm = z
  .union([
    z.literal("host-list"),
    z.literal("secret-santa"),
    z.literal("personal-lists"),
    z.null(),
    z.undefined(),
  ])
  .transform((v) => {
    if (v === "host-list" || v === "secret-santa" || v === "personal-lists") {
      return v;
    }
    // Cas "sans cadeaux" où le formulaire ne poste pas rules.mode :
    // on met un mode par défaut, non utilisé si hasGifts = false.
    return "personal-lists";
  });

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
   // nouveaux champs
  hasGifts: checkboxFromForm,
  giftMode: giftModeFromForm,
  isNoSpoil: checkboxFromForm,
  isAnonReservations: checkboxFromForm,
  isSecondHandOk: checkboxFromForm,
  isHandmadeOk: checkboxFromForm,

  // budget en euros -> cents ou null
  budgetCap: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
   .transform((v) => {
     if (v === null || v === undefined || v === "") return null;
     const s = String(v).replace(/\s/g, "").replace(",", ".");
     const n = Number.parseFloat(s);
     return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
   }),
}).transform((d) => {
  // Secret Santa force les règles de visibilité
  // Secret Santa force les règles de visibilité
   if (d.giftMode === "secret-santa") {
     d.isNoSpoil = true;
     d.isAnonReservations = true;
   }

   // Si pas de cadeaux, on neutralise le budget
   if (!d.hasGifts) {
     d.budgetCap = null;
   }

   return d;
});