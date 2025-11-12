"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(120),
  description: z.string().trim().max(500).optional(),
  eventOn: z.string().trim().min(1, "Date requise"), // ISO date or datetime-local
  location: z.string().trim().max(120).optional(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix(len = 4) {
  return Math.random().toString(36).slice(2, 2 + len);
}

function parseEventOn(s: string): Date {
  // supports "YYYY-MM-DD" or full ISO from <input type="date" | "datetime-local">
  const hasTime = /T\d{2}:\d{2}/.test(s);
  const iso = hasTime ? s : `${s}T12:00:00`; // noon to avoid TZ shift to previous day
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide");
  return d;
}

export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const raw = {
    title: (formData.get("title") || formData.get("name") || "").toString(),
    description: String(formData.get("description") || ""),
    eventOn: String(formData.get("eventOn") || ""), // expect an <input name="eventOn">
    location: String(formData.get("location") || ""),
  };
  const { title, description, eventOn, location } = schema.parse(raw);

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) throw new Error("Utilisateur introuvable");

  const eventDate = parseEventOn(eventOn);

  let base = slugify(title) || "event";
  let slug = base;

  for (let i = 0; i < 3; i++) {
    try {
      const ev = await prisma.event.create({
        data: {
          title,
          description: description || null,
          eventOn: eventDate,         // REQUIRED by schema
          location: location || null,
          ownerId: me.id,             // REQUIRED by schema
          slug,                       // UNIQUE
          memberships: { create: { userId: me.id, role: "OWNER" } },
          lists: { create: { ownerId: me.id, title: "Ma liste" } }, // optional QoL
        },
        select: { slug: true },
      });
      revalidatePath("/event");
      return { ok: true, slug: ev.slug };
    } catch (e: any) {
      if (e?.code === "P2002" && e?.meta?.target?.includes("slug")) {
        slug = `${base}-${randomSuffix()}`;
        continue;
      }
      throw e;
    }
  }

  const fallback = `${base}-${Date.now().toString(36)}`;
  const ev = await prisma.event.create({
    data: {
      title,
      description: description || null,
      eventOn: eventDate,
      location: location || null,
      ownerId: me.id,
      slug: fallback,
      memberships: { create: { userId: me.id, role: "OWNER" } },
      lists: { create: { ownerId: me.id, title: "Ma liste" } },
    },
    select: { slug: true },
  });

  revalidatePath("/event");
  return { ok: true, slug: ev.slug };
}
