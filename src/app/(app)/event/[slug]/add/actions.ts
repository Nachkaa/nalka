"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/features/events/acl";
import { limit } from "@/lib/rate-limit";
import { validateGiftUrlOrThrow } from "@/lib/url";

export async function addGift(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  if (!title) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) throw new Error("Utilisateur introuvable");

  // ACL + rate limit
  await requireCan(me.id, eventId, "gift:create");
  await limit({ key: `act:gifts:create:user:${me.id}`, max: 30, windowMs: 60 * 60_000 }); // 30/hour

  // ensure my list exists
  const list = await prisma.giftList.upsert({
    where: { ownerId_eventId: { ownerId: me.id, eventId } },
    create: { ownerId: me.id, eventId, title: "Ma liste" },
    update: {},
    select: { id: true },
  });

  const note = noteRaw || null;
  const url = urlRaw ? validateGiftUrlOrThrow(urlRaw) : null;

  await prisma.giftItem.create({
    data: { listId: list.id, title, note, url },
  });

  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}
