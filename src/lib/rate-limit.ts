import { prisma } from "@/lib/prisma";

type Opts = { key: string; max: number; windowMs: number };
export async function limit({ key, max, windowMs }: Opts) {
  const since = new Date(Date.now() - windowMs);

  const [count] = await prisma.$transaction([
    prisma.rateLimitHit.count({ where: { key, ts: { gte: since } } }),
    prisma.rateLimitHit.create({ data: { key } }),
    prisma.rateLimitHit.deleteMany({ where: { ts: { lt: since } } }), // GC
  ]);

  if (count >= max) {
    const e = new Error("Too Many Requests");
    // @ts-expect-error for Route Handlers/Next errors
    e.status = 429;
    throw e;
  }
}
