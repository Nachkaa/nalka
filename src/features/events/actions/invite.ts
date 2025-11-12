// CHANGE ONLY THIS FILE: relax auth (owner allowed) + accept id or slug

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { randomBytes } from "crypto";

const TOKEN_WINDOW_MIN = 15;
const TOKENS_PER_WINDOW_MAX = 30;

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// helper: resolve event by id or slug
async function resolveEvent(ref: string) {
  // try by id then by slug
  const byId = await prisma.event.findUnique({
    where: { id: ref },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      memberLimit: true,
      memberships: { select: { id: true } },
    },
  });
  if (byId) return byId;

  const bySlug = await prisma.event.findUnique({
    where: { slug: ref },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      memberLimit: true,
      memberships: { select: { id: true } },
    },
  });
  return bySlug;
}

export async function createInviteToken(eventRef: string, opts?: { uses?: number; ttlMinutes?: number }) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) throw new Error("Unauthorized");

  const event = await resolveEvent(eventRef);
  if (!event) throw new Error("Not found");

  // allow if owner OR admin
  const isOwner = event.ownerId === me.id;
  let isAdmin = false;
  if (!isOwner) {
    const membership = await prisma.eventMember.findUnique({
      where: { userId_eventId: { userId: me.id, eventId: event.id } },
      select: { role: true },
    });
    isAdmin = !!membership && ["OWNER", "ADMIN"].includes(membership.role);
  }
  if (!isOwner && !isAdmin) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  // rate limit: tokens created by this user for this event in last window
  const since = new Date(Date.now() - TOKEN_WINDOW_MIN * 60 * 1000);
  const recent = await prisma.inviteToken.count({
    where: { eventId: event.id, createdById: me.id, createdAt: { gt: since } },
  });
  if (recent >= TOKENS_PER_WINDOW_MAX) {
    const err: any = new Error("Too many invites created. Try later.");
    err.status = 429;
    throw err;
  }

  const remainingCapacity = Math.max(0, (event.memberLimit ?? 50) - event.memberships.length);
  if (remainingCapacity <= 0) {
    const err: any = new Error("Event is full");
    err.status = 409;
    throw err;
  }

  const requestedUses = Math.max(1, Math.trunc(opts?.uses ?? 1));
  const allowedUses = Math.min(requestedUses, remainingCapacity);

  const code = randomBytes(16).toString("base64url");
  const expiresAt = opts?.ttlMinutes ? new Date(Date.now() + opts.ttlMinutes * 60 * 1000) : null;

  const token = await prisma.inviteToken.create({
    data: {
      eventId: event.id,
      code,
      remainingUses: allowedUses,
      expiresAt,
      createdById: me.id,
    },
    select: { code: true, expiresAt: true, remainingUses: true },
  });

  const url = `${appBaseUrl()}/join?code=${token.code}`;
  return { url, expiresAt: token.expiresAt, remainingUses: token.remainingUses, slug: event.slug };
}

export async function acceptInvite(code: string) {
  const session = await auth();
  if (!session?.user?.email) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const token = await prisma.inviteToken.findUnique({
    where: { code },
    include: { event: { select: { id: true, slug: true, memberLimit: true } } },
  });
  if (!token) throw Object.assign(new Error("Invalid link"), { status: 404 });
  if (token.expiresAt && token.expiresAt < new Date()) throw Object.assign(new Error("Link expired"), { status: 410 });
  if (token.remainingUses <= 0) throw Object.assign(new Error("Link already used"), { status: 409 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const result = await prisma.$transaction(async (tx) => {
    // 1) Already a member?
    const existing = await tx.eventMember.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: token.eventId } },
      select: { id: true, eventId: true },
    });

    let joinedNow = false;

    if (!existing) {
      // 2) Capacity check only if joining now
      const limit = token.event.memberLimit ?? 50;
      const count = await tx.eventMember.count({ where: { eventId: token.eventId } });
      if (count >= limit) throw Object.assign(new Error("Event is full"), { status: 409 });

      await tx.eventMember.create({
        data: { userId: user.id, eventId: token.eventId, role: "MEMBER" },
      });

      // 3) Consume one use only on first join
      await tx.inviteToken.update({
        where: { code: token.code },
        data: { remainingUses: { decrement: 1 } },
      });

      joinedNow = true;
    }

    const eventId = existing?.eventId ?? token.eventId;

    // 4) Ensure personal gift list exists
    await tx.giftList.upsert({
      where: { ownerId_eventId: { ownerId: user.id, eventId } },
      update: {},
      create: { ownerId: user.id, eventId, title: "Ma liste" },
    });

    return { joinedNow };
  });

  return { joined: result.joinedNow, slug: token.event.slug };
}