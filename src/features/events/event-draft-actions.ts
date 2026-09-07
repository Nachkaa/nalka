"use server";

import { createEventDraft } from "@/features/events/server/event-draft";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";

export async function saveAnonymousEventDraft(formData: FormData) {
  const ip = await getClientIp();
  await limit({ key: `event:draft:ip:${ip}`, max: 30, windowMs: 60 * 60_000 });

  const token = await createEventDraft(formData);
  const claimPath = `/event/new/claim?draft=${encodeURIComponent(token)}`;
  const params = new URLSearchParams({
    from: claimPath,
    intent: "create-event",
  });

  return { loginUrl: `/login?${params.toString()}` };
}
