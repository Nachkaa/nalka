// server-only
import "server-only";
import { prisma } from "@/lib/prisma";
import type { EventSummary } from "./types";

/**
 * Events where the user is owner or member.
 * invitedCount = ALL memberships on the event.
 * progress = share of other members (excluding me) for whom I've reserved ≥1 item
 *            with status in {RESERVED, PURCHASED}.
 */
export async function getUserEventSummaries(userId: string): Promise<EventSummary[]> {
  if (!userId) return [];

  const rows = await prisma.event.findMany({
    where: { OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] },
    orderBy: { eventOn: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      eventOn: true,
      location: true,
      hasGifts: true,
      giftMode: true, // "HOST_LIST" | "SECRET_SANTA" | "PERSONAL_LISTS"
      memberships: { select: { userId: true } },
    },
  });
  if (rows.length === 0) return [];

  // My reservations across these events
  const reservations = await prisma.reservation.findMany({
    where: {
      byUserId: userId,
      status: { in: ["RESERVED", "PURCHASED"] },
      item: { list: { eventId: { in: rows.map((e) => e.id) } } },
    },
    select: { item: { select: { list: { select: { eventId: true, ownerId: true } } } } },
  });

  // Secret-Santa draw presence per event
  const ssCounts = await prisma.secretSantaAssignment.groupBy({
    by: ["eventId"],
    where: { eventId: { in: rows.map((e) => e.id) } },
    _count: { eventId: true },
  });
  const ssCountMap = new Map(ssCounts.map((r) => [r.eventId, r._count.eventId]));

  const coveredByEvent = new Map<string, Set<string>>();
  for (const r of reservations) {
    const evId = r.item.list.eventId;
    const ownerId = r.item.list.ownerId;
    if (!coveredByEvent.has(evId)) coveredByEvent.set(evId, new Set());
    coveredByEvent.get(evId)!.add(ownerId);
  }

  return rows.map((e) => {
    const memberIds = e.memberships.map((m) => m.userId);
  const others = memberIds.filter((uid) => uid !== userId);
  const denom = others.length;

  const coveredSet = coveredByEvent.get(e.id) ?? new Set<string>();
  const covered = others.reduce((n, uid) => n + (coveredSet.has(uid) ? 1 : 0), 0);
  const progress = denom === 0 ? 0 : Math.round((covered / denom) * 100);

  const dateISO = e.eventOn ? e.eventOn.toISOString().slice(0, 10) : null;
  const dateLabel = e.eventOn
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(e.eventOn)
    : null;

  const isSecretSanta = e.giftMode === "SECRET_SANTA";

  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    date: dateISO,
    dateLabel,                   // ← REQUIRED BY EventSummary
    location: e.location ?? null,
    invitedCount: memberIds.length,
      progress,
      isSecretSanta,
      hasDraw: (ssCountMap.get(e.id) ?? 0) > 0,
    };
  });
}