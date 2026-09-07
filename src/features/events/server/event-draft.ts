import { createHash, randomBytes } from "node:crypto";

import { createEventForOwner, parseEventCreateFormData } from "@/features/events/server/create-event";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const EVENT_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type DraftPayload = Record<string, string | string[]>;

type ClaimResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "invalid" | "expired" | "claimed" };

export function hashEventDraftToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function serializeFormData(formData: FormData): DraftPayload {
  const payload: DraftPayload = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;

    const existing = payload[key];
    if (existing === undefined) {
      payload[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      payload[key] = [existing, value];
    }
  }

  return payload;
}

function deserializeFormData(payload: Prisma.JsonValue) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    throw new Error("Invalid event draft payload");
  }

  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      formData.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") formData.append(key, item);
      }
    }
  }

  return formData;
}

export async function createEventDraft(formData: FormData) {
  parseEventCreateFormData(formData);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashEventDraftToken(token);
  const now = new Date();

  await prisma.$transaction([
    prisma.eventDraft.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.eventDraft.create({
      data: {
        tokenHash,
        payload: serializeFormData(formData),
        expiresAt: new Date(now.getTime() + EVENT_DRAFT_TTL_MS),
      },
    }),
  ]);

  return token;
}

async function getClaimedEvent(claimedEventId: string, userId: string): Promise<ClaimResult> {
  const event = await prisma.event.findUnique({
    where: { id: claimedEventId },
    select: { ownerId: true, slug: true },
  });

  if (!event || event.ownerId !== userId) {
    return { ok: false, reason: "claimed" };
  }

  return { ok: true, slug: event.slug };
}

export async function claimEventDraft(token: string, userId: string): Promise<ClaimResult> {
  if (!token || token.length < 32) return { ok: false, reason: "invalid" };

  const tokenHash = hashEventDraftToken(token);
  const draft = await prisma.eventDraft.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      payload: true,
      expiresAt: true,
      claimedEventId: true,
    },
  });

  if (!draft) return { ok: false, reason: "invalid" };
  if (draft.claimedEventId) return getClaimedEvent(draft.claimedEventId, userId);
  if (draft.expiresAt <= new Date()) return { ok: false, reason: "expired" };

  const formData = deserializeFormData(draft.payload);
  const eventData = parseEventCreateFormData(formData);

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.eventDraft.findUnique({
        where: { id: draft.id },
        select: { claimedEventId: true, expiresAt: true },
      });

      if (!current) return { ok: false as const, reason: "invalid" as const };
      if (current.claimedEventId) {
        const existing = await tx.event.findUnique({
          where: { id: current.claimedEventId },
          select: { ownerId: true, slug: true },
        });
        if (existing?.ownerId === userId) return { ok: true as const, slug: existing.slug };
        return { ok: false as const, reason: "claimed" as const };
      }
      if (current.expiresAt <= new Date()) {
        return { ok: false as const, reason: "expired" as const };
      }

      const event = await createEventForOwner(tx, userId, eventData);
      const claimed = await tx.eventDraft.updateMany({
        where: { id: draft.id, claimedEventId: null },
        data: { claimedEventId: event.id },
      });

      if (claimed.count !== 1) {
        throw new Error("EVENT_DRAFT_ALREADY_CLAIMED");
      }

      return { ok: true as const, slug: event.slug };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_DRAFT_ALREADY_CLAIMED") {
      const latest = await prisma.eventDraft.findUnique({
        where: { id: draft.id },
        select: { claimedEventId: true },
      });
      if (latest?.claimedEventId) return getClaimedEvent(latest.claimedEventId, userId);
      return { ok: false, reason: "claimed" };
    }
    throw error;
  }
}
