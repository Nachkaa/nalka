import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const url = req.url;
  console.info("[auth-route] GET:start url=%s", url);
  try {
    const response = await handlers.GET(req);
    console.info(
      "[auth-route] GET:ok url=%s durMs=%d status=%d",
      url,
      Date.now() - startedAt,
      response.status,
    );
    return response;
  } catch (error) {
    console.error(
      "[auth-route] GET:fail url=%s durMs=%d error=%s",
      url,
      Date.now() - startedAt,
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const url = req.url;
  console.info("[auth-route] POST:start url=%s", url);
  try {
    const response = await handlers.POST(req);
    console.info(
      "[auth-route] POST:ok url=%s durMs=%d status=%d",
      url,
      Date.now() - startedAt,
      response.status,
    );
    return response;
  } catch (error) {
    console.error(
      "[auth-route] POST:fail url=%s durMs=%d error=%s",
      url,
      Date.now() - startedAt,
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    throw error;
  }
}
