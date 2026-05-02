"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/features/events/acl";
import { resolveTargetGiftListForCurrentUser } from "@/features/gifts/server/lifecycle";
import { limit } from "@/lib/rate-limit";
import { validateGiftUrlOrThrow } from "@/lib/url";
import { processGiftImage } from "@/lib/gift-image";

export async function addGift(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  if (!title) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  await requireCan(me.id, eventId, "gift:create");
  await limit({
    key: `act:gifts:create:user:${me.id}`,
    max: 30,
    windowMs: 60 * 60_000,
  });

  const list = await resolveTargetGiftListForCurrentUser(eventId, me.id);

  const note = noteRaw || null;
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;

  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const removeImage = String(formData.get("removeImage") || "").trim() === "1";
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  let imagePath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    imagePath = await processGiftImage(imageFile);
  } else if (imageUrl) {
    imagePath = imageUrl;
  } else if (removeImage) {
    imagePath = null;
  }

  await prisma.giftItem.create({
    data: {
      listId: list.id,
      title,
      note,
      url,
      imagePath,
    },
  });

  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}
