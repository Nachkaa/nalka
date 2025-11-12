import { headers } from "next/headers";

export async function getClientIp() {
  const h = await headers(); // fix: headers() may be Promise<ReadonlyHeaders>
  const fwd = h.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  return ip;
}