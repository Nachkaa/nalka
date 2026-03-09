"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/features/events/acl";
import { limit } from "@/lib/rate-limit";
import { validateGiftUrlOrThrow } from "@/lib/url";
import { processGiftImage } from "@/lib/gift-image";
import { syncGiftListsForEvent } from "@/domain/gift-lists";
import { EventGiftMode, EventModuleKey } from "@prisma/client";

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

  // ACL + rate limit
  await requireCan(me.id, eventId, "gift:create");
  await limit({
    key: `act:gifts:create:user:${me.id}`,
    max: 30,
    windowMs: 60 * 60_000,
  }); // 30/hour

  // assure qu'une liste cible existe et récupère-la
  const list = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        giftMode: true,
        modules: {
          where: { key: EventModuleKey.GIFTS },
          select: { enabled: true },
          take: 1,
        },
      },
    });
    if (!event) throw new Error("Event not found");

    if (event.modules[0]?.enabled !== true) {
      throw new Error("Les cadeaux sont désactivés pour cet événement.");
    }

    // on laisse le domaine s'assurer que toutes les listes nécessaires existent
    await syncGiftListsForEvent(tx, event.id);

    // choix de la liste cible selon le mode
    let targetList: { id: string } | null = null;

    if (event.giftMode === EventGiftMode.HOST_LIST) {
      // une seule liste : celle du propriétaire de l'événement
      targetList = await tx.giftList.findFirst({
        where: {
          eventId: event.id,
          ownerId: event.ownerId,
        },
        select: { id: true },
      });
    } else {
      // mode PERSONAL_LISTS : liste perso de l'utilisateur courant
      targetList = await tx.giftList.findFirst({
        where: {
          eventId: event.id,
          ownerId: me.id,
        },
        select: { id: true },
      });
    }

    if (!targetList) {
      throw new Error("Aucune liste de cadeaux disponible pour cet utilisateur.");
    }

    return targetList;
  });

  const note = noteRaw || null;
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;

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
