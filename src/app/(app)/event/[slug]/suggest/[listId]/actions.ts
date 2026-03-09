"use server";

import "server-only";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validateGiftUrlOrThrow } from "@/lib/url";
import { processGiftImage } from "@/lib/gift-image";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";
import { render } from "@react-email/render";
import SuggestedIdeaEmail from "@/emails/SuggestedIdeaEmail";

export async function SuggestGiftAction(slug: string, listId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autorisé");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  // On vérifie que la liste ciblée existe
  const list = await prisma.giftList.findUnique({
    where: { id: listId },
    include: { owner: true },
  });
  if (!list) throw new Error("Liste introuvable");

  const dbEvent = await prisma.event.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!dbEvent) {
    throw new Error("Événement introuvable");
  }

  // Récupération champs
  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  const note = noteRaw || null;

  if (!title) throw new Error("Nom obligatoire");

  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;

  // Image
  const imageFile = formData.get("image") as File | null;
  const rawImageUrl = formData.get("imageUrl");
  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0 ? rawImageUrl.trim() : null;

  let imagePath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    imagePath = await processGiftImage(imageFile);
  } else if (imageUrl) {
    imagePath = imageUrl;
  }

  // Création du gift sur la liste ciblée
  await prisma.giftItem.create({
    data: {
      listId,
      title,
      note,
      url,
      imagePath,
      isSuggestion: true,
      suggestedByUserId: me.id,
    },
  });

  if (list.owner?.email) {
    const html = await render(
      SuggestedIdeaEmail({
        eventTitle: dbEvent.title,
        itemTitle: title,
        eventUrl: `${process.env.AUTH_URL}/event/${slug}`,
      }),
    );

    await sendMail({
      to: list.owner.email,
      subject: `Nouvelle suggestion dans ta liste ${dbEvent.title}`,
      html,
    });
  }
  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}
