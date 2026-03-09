// FILE: src/app/api/invite/route.ts
import { NextResponse } from "next/server";
import { createInviteToken } from "@/features/events/actions/invite";

type PostBody = {
  eventRef?: string;
  eventId?: string;
  uses?: number;
  ttlMinutes?: number;
};

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : "error";
}

function getErrorStatus(e: unknown) {
  if (typeof e === "object" && e !== null && "status" in e) {
    const s = (e as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return 400;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PostBody;

    const ref = body.eventRef ?? body.eventId; // support both for now
    if (!ref) {
      return NextResponse.json({ error: "eventRef required" }, { status: 400 });
    }

    const token = await createInviteToken(ref, {
      uses: body.uses,
      ttlMinutes: body.ttlMinutes,
    });

    return NextResponse.json(token);
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}
