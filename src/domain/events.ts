import { z } from "zod";
import { parseDateOrThrow, startOfTodayLocal } from "@/lib/dates/parseDateOrThrow";
import { EventScheduleMode, EventLocationMode } from "@prisma/client";

const checkboxFromForm = z
  .union([z.string(), z.boolean(), z.null(), z.undefined()])
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

const giftModeSchema = z
  .union([z.literal("HOST_LIST"), z.literal("PERSONAL_LISTS")])
  .optional()
  .nullable()
  .transform((v) => (v === "PERSONAL_LISTS" ? "PERSONAL_LISTS" : "HOST_LIST"));

const TimeHHmm = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  },
  z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Horaire invalide (HH:mm)." })
    .nullable(),
);

const scheduleSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal(EventScheduleMode.EXACT),
    date: z
      .string()
      .min(1, "Choisis une date.")
      .transform((v) => parseDateOrThrow(v))
      .refine((d) => d >= startOfTodayLocal(), {
        message: "La date doit être aujourd’hui ou plus tard.",
      }),
  }),
  z.object({
    mode: z.literal(EventScheduleMode.POLL),
    options: z.array(z.string()).default([]),
  }),
  z.object({
    mode: z.literal(EventScheduleMode.TBD),
  }),
]);

const locationSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal(EventLocationMode.EXACT),
    value: z
      .string()
      .min(1, "Choisis un lieu.")
      .max(120)
      .transform((v) => v.trim()),
  }),
  z.object({
    mode: z.literal(EventLocationMode.POLL),
    options: z.array(z.string()).default([]),
  }),
  z.object({
    mode: z.literal(EventLocationMode.TBD),
  }),
]);

export const EventCreateSchema = z
  .object({
    title: z.string().min(1).max(120),
    description: z
      .string()
      .max(500)
      .optional()
      .nullable()
      .transform((v) => v || null),

    location: locationSchema,
    schedule: scheduleSchema.and(z.object({ time: TimeHHmm })),

    giftMode: giftModeSchema,
    giftsEnabled: checkboxFromForm.optional(),

    secretSantaEnabled: checkboxFromForm.optional(),
    bringEnabled: checkboxFromForm.optional(),
    timelineEnabled: checkboxFromForm.optional(),

    isNoSpoil: checkboxFromForm,
    isAnonReservations: checkboxFromForm,
    isSecondHandOk: checkboxFromForm,
    isHandmadeOk: checkboxFromForm,

    budgetCap: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const s = String(v).replace(/\s/g, "").replace(",", ".");
      const n = Number.parseFloat(s);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
    }),
  })
  .transform((d) => d);
