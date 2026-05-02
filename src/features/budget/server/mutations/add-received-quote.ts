"use server";

import {
  addReceivedQuoteSchema,
  normalizeAttachmentDrafts,
  normalizeMoneyInput,
  normalizeOptionalDateValue,
  normalizeOptionalString,
  type QuoteMutationResult,
} from "@/features/budget/lib/sourcing-forms";
import { assertBudgetLineWritableInEvent } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function resolveVendorId(args: {
  eventId: string;
  vendorId: string;
  vendorName: string;
  vendorType: string;
  contactName: string;
  email: string;
  phone: string;
}) {
  if (args.vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: args.vendorId,
        eventId: args.eventId,
      },
      select: { id: true },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return vendor.id;
  }

  const existingVendor = await prisma.vendor.findFirst({
    where: {
      eventId: args.eventId,
      name: args.vendorName,
    },
    select: { id: true },
  });

  if (existingVendor) {
    await prisma.vendor.update({
      where: { id: existingVendor.id },
      data: {
        vendorType: normalizeOptionalString(args.vendorType),
        contactName: normalizeOptionalString(args.contactName),
        email: normalizeOptionalString(args.email),
        phone: normalizeOptionalString(args.phone),
      },
    });
    return existingVendor.id;
  }

  const vendor = await prisma.vendor.create({
    data: {
      eventId: args.eventId,
      name: args.vendorName,
      vendorType: normalizeOptionalString(args.vendorType),
      contactName: normalizeOptionalString(args.contactName),
      email: normalizeOptionalString(args.email),
      phone: normalizeOptionalString(args.phone),
    },
    select: { id: true },
  });

  return vendor.id;
}

export async function addReceivedQuote(input: unknown): Promise<QuoteMutationResult> {
  const parsed = addReceivedQuoteSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        budgetLineId: fieldErrors.budgetLineId?.[0],
        vendorId: fieldErrors.vendorId?.[0],
        vendorName: fieldErrors.vendorName?.[0],
        vendorType: fieldErrors.vendorType?.[0],
        contactName: fieldErrors.contactName?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        amount: fieldErrors.amount?.[0],
        scope: fieldErrors.scope?.[0],
        receivedAt: fieldErrors.receivedAt?.[0],
        validUntil: fieldErrors.validUntil?.[0],
        internalNote: fieldErrors.internalNote?.[0],
        decisionNote: fieldErrors.decisionNote?.[0],
      },
    };
  }

  const {
    eventSlug,
    budgetLineId,
    vendorId,
    vendorName,
    vendorType,
    contactName,
    email,
    phone,
    amount,
    scope,
    receivedAt,
    validUntil,
    internalNote,
    decisionNote,
    attachments,
  } = parsed.data;
  const accessResult = await resolveWritableBudgetAccess(() => requireWritableBudgetAccess(eventSlug));
  if (!accessResult.ok) {
    return {
      ok: false,
      formError: accessResult.formError,
    };
  }
  const access = accessResult.access;
  const line = await assertBudgetLineWritableInEvent({
    budgetLineId,
    eventId: access.event.id,
  });

  let resolvedVendorId: string;

  try {
    resolvedVendorId = await resolveVendorId({
      eventId: access.event.id,
      vendorId,
      vendorName,
      vendorType,
      contactName,
      email,
      phone,
    });
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "Impossible de retrouver le fournisseur.",
    };
  }

  const quote = await prisma.quote.create({
    data: {
      budgetLineId: line.id,
      vendorId: resolvedVendorId,
      status: "RECEIVED",
      amount: normalizeMoneyInput(amount),
      scope: normalizeOptionalString(scope),
      receivedAt: new Date(receivedAt),
      validUntil: normalizeOptionalDateValue(validUntil),
      internalNote: normalizeOptionalString(internalNote),
      decisionNote: normalizeOptionalString(decisionNote),
    },
    select: { id: true },
  });

  const attachmentDrafts = normalizeAttachmentDrafts(attachments);
  if (attachmentDrafts.length > 0) {
    await prisma.quoteAttachment.createMany({
      data: attachmentDrafts.map((attachment) => ({
        quoteId: quote.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        mimeType: attachment.mimeType ?? null,
        fileSizeBytes: attachment.fileSizeBytes ?? null,
      })),
    });
  }

  if (line.sourcingStatus === "DRAFT" || line.sourcingStatus === "SOURCING") {
    await prisma.budgetLine.update({
      where: { id: line.id },
      data: { sourcingStatus: "QUOTES_RECEIVED" },
    });
  }

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
