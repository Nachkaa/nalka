"use server";

import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventGiftMode } from "@prisma/client";

function toPrismaGiftMode(
  mode: "host-list" | "secret-santa" | "personal-lists",
): EventGiftMode {
  switch (mode) {
    case "host-list":
      return "HOST_LIST";
    case "secret-santa":
      return "SECRET_SANTA";
    case "personal-lists":
    default:
      return "PERSONAL_LISTS";
  }
}

export async function updateEvent(eventId: string, slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "").trim() || null;

  if (!title || !date) throw new Error("Champs requis manquants");

  // Nouveaux champs : hasGifts + mode
  const hasGifts = formData.get("rules.hasGifts") === "true";
  const giftModeRaw = formData.get("rules.mode");
  const giftMode =
    giftModeRaw === "host-list" ||
    giftModeRaw === "secret-santa" ||
    giftModeRaw === "personal-lists"
      ? giftModeRaw
      : "personal-lists";

  // Visibilité + préférences
  let isNoSpoil = formData.get("rules.isNoSpoil") === "true";
  let isAnonReservations = formData.get("rules.isAnonReservations") === "true";
  const isSecondHandOk = formData.get("rules.isSecondHandOk") === "true";
  const isHandmadeOk = formData.get("rules.isHandmadeOk") === "true";

  // Secret Santa force la visibilité
  if (giftMode === "secret-santa") {
    isNoSpoil = true;
    isAnonReservations = true;
  }

  // Budget: string -> cents ou null (et neutralisé si pas de cadeaux)
  const budgetCapRaw = String(formData.get("rules.budgetCap") || "")
    .replace(/\s/g, "")
    .replace(",", ".");
  let budgetCapCents: number | null = null;
  if (hasGifts && budgetCapRaw) {
    const n = Number.parseFloat(budgetCapRaw);
    budgetCapCents = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      eventOn: new Date(date),
      location,

      hasGifts,
      giftMode: toPrismaGiftMode(giftMode),
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
