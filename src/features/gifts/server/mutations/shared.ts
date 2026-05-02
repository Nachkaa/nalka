import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";

import SuggestedIdeaEmail from "@/emails/SuggestedIdeaEmail";
import { resolveTargetGiftListForCurrentUser } from "@/features/gifts/server/lifecycle";
import { sendGiftRemovedEmail } from "@/features/notifications/sendGiftRemovedEmail";
import { processGiftImage } from "@/lib/gift-image";
import { sendMail } from "@/lib/mail";
import { limit } from "@/lib/rate-limit";
import { validateGiftUrlOrThrow } from "@/lib/url";

export async function applyGiftRateLimit(args: {
  action: string;
  userId: string;
  max: number;
}) {
  await limit({
    key: `act:gifts:${args.action}:user:${args.userId}`,
    max: args.max,
    windowMs: 60 * 60_000,
  });
}

export function parseGiftFormInput(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();

  if (!title) {
    throw new Error("Le titre est requis");
  }

  return {
    title,
    note: noteRaw || null,
    url: urlRaw ? validateGiftUrlOrThrow(urlRaw) : null,
  };
}

export async function resolveGiftImage(formData: FormData, currentImagePath: string | null = null) {
  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const removeImage = String(formData.get("removeImage") || "").trim() === "1";
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  if (imageFile && imageFile.size > 0) {
    return processGiftImage(imageFile);
  }

  if (imageUrl) {
    return imageUrl;
  }

  if (removeImage) {
    return null;
  }

  return currentImagePath;
}

export async function resolveTargetListForCurrentUser(eventId: string, userId: string) {
  return resolveTargetGiftListForCurrentUser(eventId, userId);
}

export function revalidateGiftPaths(slug: string) {
  revalidatePath(`/event/${slug}`);
  revalidatePath(`/event/${slug}/gifts`);
}

export function revalidateGiftSettingsPaths(slug: string) {
  revalidateGiftPaths(slug);
  revalidatePath(`/event/${slug}/budget`);
}

export async function notifyGiftReservers(args: {
  reservations: Array<{
    byUser: {
      email: string | null;
      name: string | null;
    } | null;
  }>;
  giftTitle: string;
  eventTitle: string;
  ownerName: string;
}) {
  for (const reservation of args.reservations) {
    if (!reservation.byUser?.email) continue;

    await sendGiftRemovedEmail({
      to: reservation.byUser.email,
      recipientName: reservation.byUser.name ?? "Participant",
      eventTitle: args.eventTitle,
      giftTitle: args.giftTitle,
      ownerName: args.ownerName,
    });
  }
}

export async function notifySuggestedGiftOwner(args: {
  ownerEmail: string | null | undefined;
  eventTitle: string;
  giftTitle: string;
  slug: string;
}) {
  if (!args.ownerEmail) {
    return;
  }

  const html = await render(
    SuggestedIdeaEmail({
      eventTitle: args.eventTitle,
      itemTitle: args.giftTitle,
      eventUrl: `${process.env.AUTH_URL}/event/${args.slug}`,
    }),
  );

  await sendMail({
    to: args.ownerEmail,
    subject: `Nouvelle suggestion dans ta liste ${args.eventTitle}`,
    html,
  });
}
