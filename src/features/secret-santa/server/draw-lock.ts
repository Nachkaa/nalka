import { createHash } from "node:crypto";
import { Client } from "pg";

type DrawLock = { assertHeld: () => Promise<void> };

// A dedicated session keeps its lock after the assignment transaction commits.
// Never acquire a session lock through Prisma's shared connection pool.
export async function withDrawLock<T>(
  eventId: string,
  work: (lock: DrawLock) => Promise<T>,
): Promise<T | null> {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Connexion au tirage indisponible.");
  const url = new URL(connectionString);
  if (url.searchParams.get("pgbouncer") === "true") {
    throw new Error("Le tirage nécessite une connexion PostgreSQL directe (DIRECT_URL).");
  }
  const key = createHash("sha256")
    .update(`nalka:secret-santa:${url.searchParams.get("schema") ?? "public"}:${eventId}`)
    .digest()
    .readBigInt64BE()
    .toString();
  const client = new Client({
    connectionString,
    application_name: "nalka-secret-santa-draw",
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
    keepAlive: true,
  });
  let lost = false;
  client.on("error", () => {
    lost = true;
  });
  client.on("end", () => {
    lost = true;
  });
  const assertHeld = async () => {
    if (!lost) {
      try {
        await client.query("SELECT 1");
      } catch {
        lost = true;
      }
    }
    if (lost) throw new Error("La connexion au tirage a été interrompue.");
  };
  try {
    try {
      await client.connect();
      const result = await client.query<{ locked: boolean }>(
        "SELECT pg_try_advisory_lock($1::bigint) AS locked",
        [key],
      );
      if (!result.rows[0]?.locked) return null;
    } catch {
      throw new Error("Le tirage est temporairement indisponible. Réessaie dans un instant.");
    }
    return await work({ assertHeld });
  } finally {
    // Ending the dedicated session releases its lock on every return/error path.
    await client.end().catch(() => {});
  }
}
