"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { limit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/req";

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "on" || s === "1" || s === "yes";
}

function parseBudgetCents(v: string | null | undefined) {
  const t = (v ?? "").toString().trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

const schema = z.object({
  eventId: z.string().min(1),
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

function normalizeUrl(raw?: string | null) {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export async function deleteGift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const itemId = formData.get("itemId")?.toString();
  const eventId = formData.get("eventId")?.toString();
  if (!itemId || !eventId) throw new Error("Paramètres manquants");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) throw new Error("Utilisateur introuvable");

  // Vérifie la propriété de l’item
  const item = await prisma.giftItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.ownerId !== me.id) throw new Error("Interdit");

  // Nettoie les réservations liées
  await prisma.reservation.deleteMany({ where: { itemId } });
  await prisma.giftItem.delete({ where: { id: itemId } });

  revalidatePath(`/app/event/${eventId}`);
}

export async function inviteMember(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const { eventId, email } = schema.parse({
    eventId: String(formData.get("eventId") || ""),
    email: String(formData.get("email") || ""),
  });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) throw new Error("User not found");

  // RATE LIMITS — abuse control
  const ip = await getClientIp();
  await limit({ key: `invite:ip:${ip}`, max: 60, windowMs: 60 * 60_000 });            // 60 / hour / IP
  await limit({ key: `invite:user:${me.id}`, max: 200, windowMs: 24 * 60 * 60_000 }); // 200 / day / inviter
  await limit({ key: `invite:event:${eventId}`, max: 500, windowMs: 24 * 60 * 60_000 }); // 500 / day / event
  await limit({ key: `invite:target:${email}`, max: 3, windowMs: 24 * 60 * 60_000 }); // 3 / day / target email

  // must be OWNER or ADMIN
  const myMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!myMembership || !["OWNER", "ADMIN"].includes(myMembership.role)) {
    throw new Error("Forbidden");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, slug: true },
  });
  if (!event) throw new Error("Event not found");

  // ensure user exists
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { id: true, email: true, name: true },
  });

  // ensure membership
  await prisma.eventMember.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: {},
    create: { userId: user.id, eventId, role: "MEMBER" },
  });

  // ensure gift list
  await prisma.giftList.upsert({
    where: { ownerId_eventId: { ownerId: user.id, eventId } },
    update: {},
    create: { title: `Liste de ${user.name ?? user.email}`, ownerId: user.id, eventId },
  });

  // invite email
  const qp = new URLSearchParams({
    source: "invite",
    eventTitle: event.title,
    inviter: me.name ?? me.email,
  });

  const res = await signIn("nodemailer", {
    email,
    redirect: false,
    redirectTo: `/event/${event.slug}?${qp.toString()}`,
  });
  if (res?.error) throw new Error(res.error);

  // cache
  revalidatePath(`/event/${event.slug}`);

  return { ok: true };
}

export async function removeMember(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const eventId = fd.get("eventId")?.toString();
  const userId  = fd.get("userId")?.toString();
  const slug    = fd.get("slug")?.toString();
  if (!eventId || !userId) throw new Error("Champs requis");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const meMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!meMembership) throw new Error("Interdit");

  const targetMembership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { role: true },
  });
  if (!targetMembership) return; // already removed

  if (meMembership.role === "ADMIN" && targetMembership.role !== "MEMBER") throw new Error("Interdit");
  if (meMembership.role === "OWNER" && userId === me.id) throw new Error("Interdit");

  await prisma.$transaction(async (tx) => {
    // Secret-Santa: rewire C→B, delete A→B, or purge links if partial
    const aToB = await tx.secretSantaAssignment.findUnique({
      where: { eventId_giverId: { eventId, giverId: userId } },
      select: { receiverId: true },
    });
    const cToA = await tx.secretSantaAssignment.findFirst({
      where: { eventId, receiverId: userId },
      select: { giverId: true },
    });

    if (aToB && cToA) {
      await tx.secretSantaAssignment.update({
        where: { eventId_giverId: { eventId, giverId: cToA.giverId } },
        data: { receiverId: aToB.receiverId },
      });
      await tx.secretSantaAssignment.delete({
        where: { eventId_giverId: { eventId, giverId: userId } },
      });
    } else {
      await tx.secretSantaAssignment.deleteMany({
        where: { eventId, OR: [{ giverId: userId }, { receiverId: userId }] },
      });
    }

    // If <2 members remain, wipe all assignments
    const remaining = await tx.eventMember.count({
      where: { eventId, NOT: { userId } },
    });
    if (remaining < 2) {
      await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    }

    // Release reservations and delete list + membership
    await tx.reservation.updateMany({
      where: { byUserId: userId, status: { not: "RELEASED" }, item: { list: { eventId } } },
      data: { status: "RELEASED" },
    });
    await tx.giftList.deleteMany({ where: { ownerId: userId, eventId } });
    await tx.eventMember.delete({ where: { userId_eventId: { userId, eventId } } });
  });

  revalidatePath(slug ? `/event/${slug}` : "/event");
}

export async function updateEvent(eventId: string, slug: string, fd: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("Utilisateur introuvable");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw new Error("Événement introuvable");

  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Interdit");
  }

  const title = fd.get("title")?.toString().trim();
  const description = fd.get("description")?.toString().trim() || null;
  const location = fd.get("location")?.toString().trim() || null;

  // date en local-only (évite TZ issues). Choix: 12:00 local pour neutraliser.
  const dateRaw = fd.get("date")?.toString().trim();
  const eventOn = dateRaw ? new Date(`${dateRaw}T12:00:00`) : undefined;

  const budgetCapCents = parseBudgetCents(fd.get("rules.budgetCap")?.toString());

  // ⬇️ Nouveau: Secret Santa + forçage visibilité
  const isSecretSanta = bool(fd, "rules.isSecretSanta");
  const isNoSpoil = isSecretSanta ? true : bool(fd, "rules.isNoSpoil");
  const isAnonReservations = isSecretSanta ? true : bool(fd, "rules.isAnonReservations");
  const isSecondHandOk = bool(fd, "rules.isSecondHandOk");
  const isHandmadeOk = bool(fd, "rules.isHandmadeOk");

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(title ? { title } : {}),
      description,
      location,
      ...(eventOn ? { eventOn } : {}),
      // règles persistées
      isSecretSanta,
      isNoSpoil,
      isAnonReservations,
      isSecondHandOk,
      isHandmadeOk,
      budgetCapCents,
    },
  });

  revalidatePath(`/event/${slug}`);
  return { ok: true };
}

export async function deleteEvent(fd: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const eventId = fd.get("eventId")?.toString();
  if (!eventId) throw new Error("Missing eventId");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("User not found");

  // Only OWNER can delete (safer than ADMIN)
  const membership = await prisma.eventMember.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") throw new Error("Forbidden");

  await prisma.event.delete({ where: { id: eventId } }); // cascades per schema

  revalidatePath("/event");
  redirect("/event");
}