import { NextResponse } from "next/server";
import { createInviteToken } from "@/features/events/actions/invite";

export async function POST(req: Request) {
  try {
    const { eventRef, eventId, uses, ttlMinutes } = await req.json();
    const ref = eventRef ?? eventId; // support both for now
    if (!ref) return NextResponse.json({ error: "eventRef required" }, { status: 400 });

    const token = await createInviteToken(ref, { uses, ttlMinutes });
    return NextResponse.json(token);
  } catch (e: any) {
    const status = Number(e?.status) || 400;
    return NextResponse.json({ error: e?.message || "error" }, { status });
  }
}