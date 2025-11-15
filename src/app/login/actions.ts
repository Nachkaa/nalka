// tolerant parsing and prefer redirectTo
"use server";

import { signIn } from "@/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  email: z.string().email().max(254),
  callbackUrl: z.string().optional(),
  redirectTo: z.string().optional(),
});

function pickSafePath(v?: string) {
  const s = (v || "").trim();
  return s.startsWith("/") ? s : "";
}

function withQuery(path: string, extra: Record<string, string | undefined>) {
  const u = new URL(path, "http://local");
  for (const [k, v] of Object.entries(extra)) if (v) u.searchParams.set(k, v);
  return u.pathname + u.search;
}

// null -> undefined to satisfy Record<string, string | undefined>
const asOpt = (v: string | null | undefined): string | undefined =>
  v ?? undefined;

export async function sendMagicLink(input: unknown) {
  const raw =
    input instanceof FormData
      ? {
          email: String(input.get("email") || ""),
          callbackUrl: String(input.get("callbackUrl") || ""),
          redirectTo: String(input.get("redirectTo") || ""),
        }
      : (input as Partial<z.infer<typeof Schema>>);

  const { email } = Schema.pick({ email: true }).parse({ email: raw?.email });
  const redirectToIn = pickSafePath(raw?.redirectTo);
  const callbackUrlIn = pickSafePath(raw?.callbackUrl);

  let redirectTo = redirectToIn || callbackUrlIn || "/event/new";

  if (redirectTo.startsWith("/join")) {
    const code = new URL("http://x" + redirectTo).searchParams.get("code") || "";

    if (code) {
      const token = await prisma.inviteToken.findUnique({
        where: { code },
        select: {
          event: {
            select: {
              title: true,
              owner: { select: { name: true } },
            },
          },
        },
      });

      redirectTo = withQuery(redirectTo, {
        source: "invite",
        eventTitle: token?.event.title,          // string | undefined
        inviter: asOpt(token?.event.owner?.name) // string | undefined
      });
    }
  }

  const res = await signIn("nodemailer", {
    email,
    redirect: false,
    redirectTo,
  });

  if (res?.error) throw new Error(res.error);
  return { ok: true };
}
