"use server";

import { requireCurrentUserId } from "@/features/auth/server/require-current-user-id";
import { createEventFromFormData } from "@/features/events/server/create-event";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const ownerId = await requireCurrentUserId();

  const ip = await getClientIp();
  await limit({ key: `event:create:ip:${ip}`, max: 20, windowMs: 60 * 60_000 });
  await limit({ key: `event:create:user:${ownerId}`, max: 10, windowMs: 24 * 60 * 60_000 });

  const event = await createEventFromFormData(ownerId, formData);

  revalidatePath("/event");
  redirect(`/event/${event.slug}`);
}
