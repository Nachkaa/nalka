import { z } from "zod";
import { parseDateOrThrow, startOfTodayLocal } from "@/lib/dates/parseDateOrThrow";
import { EventScheduleMode, EventLocationMode } from "@prisma/client";
import { EmailDomainListSchema } from "@/features/events/email-domain-policy";

export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MAX_LENGTH = 1000;

export const EventDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un nom pour l’événement.")
    .max(EVENT_TITLE_MAX_LENGTH, `Le nom est limité à ${EVENT_TITLE_MAX_LENGTH} caractères.`),
  description: z
    .string()
    .max(
      EVENT_DESCRIPTION_MAX_LENGTH,
      `La description est limitée à ${EVENT_DESCRIPTION_MAX_LENGTH} caractères.`,
    )
    .optional()
    .nullable()
    .transform((value) => value || null),
});

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

export const EventCreateSchema = EventDetailsSchema.extend({
  allowedEmailDomains: EmailDomainListSchema.default([]),
  location: locationSchema,
  schedule: scheduleSchema.and(z.object({ time: TimeHHmm })),

  giftMode: giftModeSchema,
  giftsEnabled: checkboxFromForm.optional(),

  secretSantaEnabled: checkboxFromForm.optional(),
  bringEnabled: checkboxFromForm.optional(),
  timelineEnabled: checkboxFromForm.optional(),
  budgetEnabled: checkboxFromForm.optional(),

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
}).transform((d) => d);
