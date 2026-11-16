import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function drawRevision(assignments: ReadonlyArray<{ id: string }>): string {
  if (!assignments.length) return "none";
  return createHash("sha256")
    .update(JSON.stringify(assignments.map(({ id }) => id).sort()))
    .digest("hex");
}

export async function readDrawRevision(
  eventId: string,
  db: Pick<Prisma.TransactionClient, "secretSantaAssignment"> = prisma,
) {
  return drawRevision(
    await db.secretSantaAssignment.findMany({ where: { eventId }, select: { id: true } }),
  );
}
