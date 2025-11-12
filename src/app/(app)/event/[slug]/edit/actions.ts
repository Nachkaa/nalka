"use server";

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateEvent(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "").trim() || null;

  const isSecretSanta = formData.get("rules.isSecretSanta") === "true";
  const isNoSpoil = isSecretSanta ? true : formData.get("rules.isNoSpoil") === "true";
  const isAnonReservations = isSecretSanta ? true : formData.get("rules.isAnonReservations") === "true";
  const isSecondHandOk = formData.get("rules.isSecondHandOk") === "true";
  const isHandmadeOk = formData.get("rules.isHandmadeOk") === "true";
  const budgetCapRaw = String(formData.get("rules.budgetCap") || "").replace(",", ".");
  const budgetCapCents =
    budgetCapRaw ? Math.max(0, Math.round(parseFloat(budgetCapRaw) * 100)) : null;

  if (!title || !date) throw new Error("Champs requis manquants");

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      eventOn: new Date(date),
      location,
      isSecretSanta,
      isNoSpoil,
      isAnonReservations,
      isSecondHandOk,
      isHandmadeOk,
      budgetCapCents,
    },
  });

  revalidatePath(`/event/${slug}`);
  redirect(`/event/${slug}`);
}
