"use server";

import {
  addSourcingVendorSchema,
  normalizeOptionalDateValue,
  normalizeOptionalString,
  type QuoteMutationResult,
} from "@/features/budget/lib/sourcing-forms";
import { assertBudgetLineWritableInEvent } from "@/features/budget/server/invariants";
import { requireWritableBudgetAccess } from "@/features/budget/server/queries/_shared";
import { resolveWritableBudgetAccess } from "@/features/budget/server/write-access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function findOrCreateVendor(args: {
  eventId: string;
  vendorName: string;
  vendorType: string;
  contactName: string;
  email: string;
  phone: string;
}) {
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

export async function addSourcingVendor(input: unknown): Promise<QuoteMutationResult> {
  const parsed = addSourcingVendorSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Corrigez les champs invalides.",
      fieldErrors: {
        budgetLineId: fieldErrors.budgetLineId?.[0],
        vendorName: fieldErrors.vendorName?.[0],
        vendorType: fieldErrors.vendorType?.[0],
        contactName: fieldErrors.contactName?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        requestedAt: fieldErrors.requestedAt?.[0],
        internalNote: fieldErrors.internalNote?.[0],
      },
    };
  }

  const { eventSlug, budgetLineId, vendorName, vendorType, contactName, email, phone, requestedAt, internalNote } =
    parsed.data;
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

  const vendorId = await findOrCreateVendor({
    eventId: access.event.id,
    vendorName,
    vendorType,
    contactName,
    email,
    phone,
  });

  await prisma.quote.create({
    data: {
      budgetLineId: line.id,
      vendorId,
      status: "AWAITING_RESPONSE",
      requestedAt: normalizeOptionalDateValue(requestedAt),
      internalNote: normalizeOptionalString(internalNote),
    },
  });

  if (line.sourcingStatus === "DRAFT") {
    await prisma.budgetLine.update({
      where: { id: line.id },
      data: { sourcingStatus: "SOURCING" },
    });
  }

  revalidatePath(`/event/${eventSlug}/budget`);
  revalidatePath(`/event/${eventSlug}/budget/lines`);
  revalidatePath(`/event/${eventSlug}/budget/quotes`);
  revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);

  return { ok: true };
}
