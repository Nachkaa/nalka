"use server";

import { revalidatePath } from "next/cache";

import { requireEventOrganizer } from "@/features/events/access";
import { parseEventEmailDomainFormData } from "@/features/events/email-domain-policy";
import { prisma } from "@/lib/prisma";

export async function updateEventEmailDomains(slug: string, formData: FormData) {
  const { event } = await requireEventOrganizer({ slug });
  const allowedEmailDomains = parseEventEmailDomainFormData(formData);

  await prisma.event.update({
    where: { id: event.id },
    data: { allowedEmailDomains },
  });

  revalidatePath(`/event/${event.slug}/edit`);
  revalidatePath(`/event/${event.slug}`);
  return { allowedEmailDomains };
}
