import type { QuoteAttachmentDraft } from "@/features/budget/lib/types";
import { z } from "zod";

const optionalTrimmed = z.string().trim().optional().transform((value) => value ?? "");

const optionalEmail = optionalTrimmed.refine(
  (value) => value === "" || z.email().safeParse(value).success,
  "L'adresse e-mail doit etre valide",
);

const optionalDateString = optionalTrimmed.refine(
  (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
  "La date doit etre valide",
);

const attachmentDraftSchema = z.object({
  fileName: z.string().trim().min(1),
  fileUrl: z.string().trim().url(),
  mimeType: z.string().trim().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
});

const vendorFieldsSchema = z.object({
  vendorName: z.string().trim().min(1, "Le nom du fournisseur est requis"),
  vendorType: optionalTrimmed,
  contactName: optionalTrimmed,
  email: optionalEmail,
  phone: optionalTrimmed,
});

export const addSourcingVendorSchema = vendorFieldsSchema.extend({
  eventSlug: z.string().trim().min(1),
  budgetLineId: z.string().trim().min(1, "La ligne budgetaire est requise"),
  requestedAt: optionalDateString,
  internalNote: optionalTrimmed,
});

export const addReceivedQuoteSchema = z
  .object({
    eventSlug: z.string().trim().min(1),
    budgetLineId: z.string().trim().min(1, "La ligne budgetaire est requise"),
    vendorId: optionalTrimmed,
    vendorName: optionalTrimmed,
    vendorType: optionalTrimmed,
    contactName: optionalTrimmed,
    email: optionalEmail,
    phone: optionalTrimmed,
    amount: z
      .string()
      .trim()
      .min(1, "Le montant est requis")
      .refine((value) => !Number.isNaN(Number(value)), "Le montant doit etre valide")
      .refine((value) => Number(value) >= 0, "Le montant doit etre superieur ou egal a 0"),
    scope: optionalTrimmed,
    receivedAt: z
      .string()
      .trim()
      .min(1, "La date de reception est requise")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "La date doit etre valide"),
    validUntil: optionalDateString,
    internalNote: optionalTrimmed,
    decisionNote: optionalTrimmed,
    attachments: z.array(attachmentDraftSchema).optional().default([]),
  })
  .refine((value) => value.vendorId !== "" || value.vendorName !== "", {
    message: "Choisissez un fournisseur existant ou renseignez un nom de fournisseur",
    path: ["vendorName"],
  });

export type AddSourcingVendorInput = z.infer<typeof addSourcingVendorSchema>;
export type AddReceivedQuoteInput = z.infer<typeof addReceivedQuoteSchema>;

export type QuoteMutationResult = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      | "budgetLineId"
      | "vendorId"
      | "vendorName"
      | "vendorType"
      | "contactName"
      | "email"
      | "phone"
      | "requestedAt"
      | "amount"
      | "scope"
      | "receivedAt"
      | "validUntil"
      | "internalNote"
      | "decisionNote",
      string
    >
  >;
};

export function normalizeOptionalDateValue(value: string) {
  return value ? new Date(value) : null;
}

export function normalizeOptionalString(value: string) {
  return value ? value : null;
}

export function normalizeMoneyInput(value: string) {
  return Number(value).toFixed(2);
}

export function normalizeAttachmentDrafts(attachments: QuoteAttachmentDraft[] | undefined) {
  return attachments ?? [];
}
