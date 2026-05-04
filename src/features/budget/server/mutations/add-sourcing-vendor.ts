"use server";

import { Prisma } from "@prisma/client";

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

  let vendorId: string;
  try {
    const vendor = await prisma.vendor.create({
      data: {
        eventId: access.event.id,
        name: vendorName,
        vendorType: normalizeOptionalString(vendorType),
        contactName: normalizeOptionalString(contactName),
        email: normalizeOptionalString(email),
        phone: normalizeOptionalString(phone),
      },
      select: { id: true },
    });
    vendorId = vendor.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        formError: `Un prestataire nommé «${vendorName}» existe déjà sur cet événement. Sélectionnez-le dans la liste ou choisissez un autre nom.`,
      };
    }
    throw error;
  }

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
