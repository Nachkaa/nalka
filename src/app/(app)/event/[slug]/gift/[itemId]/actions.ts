"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/url";

export async function updateGift(slug: string, itemId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const title = formData.get("title")?.toString().trim();
  const urlRaw = formData.get("url")?.toString() ?? "";
  const note = formData.get("note")?.toString().trim() || null;
  if (!title) throw new Error("Champs requis");

  // Vérif: l’item m’appartient et est bien dans l’event du slug
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { ownerId: true, event: { select: { slug: true } } } } },
  });
  if (!item || item.list.ownerId !== me.id || item.list.event.slug !== slug) {
    throw new Error("Interdit");
  }

  const url = urlRaw ? normalizeUrl(urlRaw) : null;

  await prisma.giftItem.update({
    where: { id: itemId },
    data: { title, url, note },
  });

  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}
