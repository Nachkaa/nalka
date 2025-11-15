"use server";

import { prisma } from "@/lib/prisma";
import { EventCreateSchema } from "@/domain/events";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";
import { nanoid } from "nanoid";
import { EventGiftMode } from "@prisma/client";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

async function requireUserId() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Garantit un user en base, même si NextAuth n’a pas encore créé la ligne
  if (session.user.id) {
    const byId = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
    if (byId) return byId.id;
  }
  if (!session.user.email) throw new Error("Missing email");

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined },
    create: { email: session.user.email, name: session.user.name ?? null },
    select: { id: true },
  });
  return user.id;
}

function parseDateOrThrow(v: unknown): Date {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = String(v || "");
  const hasTime = /T\d{2}:\d{2}/.test(s);
  const iso = hasTime ? s : `${s}T12:00:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

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

export async function createEvent(formData: FormData) {
  const ownerId = await requireUserId();

  // Abuse controls
  const ip = await getClientIp();
  await limit({ key: `event:create:ip:${ip}`, max: 20, windowMs: 60 * 60_000 });   // 20/hour/IP
  await limit({ key: `event:create:user:${ownerId}`, max: 10, windowMs: 24 * 60 * 60_000 }); // 10/day/user

  const parsed = EventCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),

    hasGifts: formData.get("rules.hasGifts"),
    giftMode: formData.get("rules.mode"),

    isNoSpoil: formData.get("rules.isNoSpoil"),
    isAnonReservations: formData.get("rules.isAnonReservations"),
    isSecondHandOk: formData.get("rules.isSecondHandOk"),
    isHandmadeOk: formData.get("rules.isHandmadeOk"),
    budgetCap: formData.get("rules.budgetCap"),

  });
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error("Invalid input");
  }

  const data = parsed.data;

  const base = slugify(data.title) || nanoid(6);
  const slug = `${base}-${nanoid(6)}`;

  const eventOn = parseDateOrThrow(data.date);

  const e = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        slug,
        title: data.title.trim(),
        description: data.description || null,
        eventOn,
        location: data.location || null,
        ownerId,

        hasGifts: data.hasGifts,
        giftMode: toPrismaGiftMode(data.giftMode),

        isNoSpoil: !!data.isNoSpoil,
        isAnonReservations: !!data.isAnonReservations,
        isSecondHandOk: !!data.isSecondHandOk,
        isHandmadeOk: !!data.isHandmadeOk,
        budgetCapCents: data.budgetCap,
      },
      select: { id: true, slug: true },
    });

    await tx.eventMember.upsert({
      where: { userId_eventId: { userId: ownerId, eventId: event.id } },
      update: { role: "OWNER" },
      create: { eventId: event.id, userId: ownerId, role: "OWNER" },
    });

    await tx.giftList.upsert({
      where: { ownerId_eventId: { ownerId, eventId: event.id } },
      update: {},
      create: { ownerId, eventId: event.id, title: "Ma liste" },
    });

    return event;
  });

  revalidatePath("/event");
  redirect(`/event/${e.slug}`);
}