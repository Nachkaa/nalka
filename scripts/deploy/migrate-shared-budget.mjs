import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { assertCompatibleMigrations } from "./migrations.mjs";

export const SHARED_BUDGET_MIGRATION = "20261125120000_shared_expense_budget";
export const SHARED_BUDGET_SQL_SHA256 =
  "7e535582145fa999bdd52ba205a54071bbf5707b12592a00d0bce66e277b3930";

/** This is a single reviewed additive migration, never a general pending-migration runner. */
export function reviewSharedBudgetMigration(manifest, actual, sql) {
  const hash = createHash("sha256").update(sql).digest("hex");
  const target = manifest.migrations.find((m) => m.name === SHARED_BUDGET_MIGRATION);
  if (hash !== SHARED_BUDGET_SQL_SHA256 || target?.checksum !== hash) {
    throw new Error("The shared-budget migration is not the reviewed SQL.");
  }
  const done = actual.some(
    (row) => row.migration_name === target.name && row.finished_at && !row.rolled_back_at,
  );
  assertCompatibleMigrations(
    done ? manifest.migrations : manifest.migrations.filter((m) => m.name !== target.name),
    actual,
  );
  return done ? "already-applied" : "apply";
}

export async function applyReviewedSharedBudgetMigration(client, manifest, sql) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock($1)", [1279508801]);
    const { rows } = await client.query(
      'SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" FOR UPDATE',
    );
    const decision = reviewSharedBudgetMigration(manifest, rows, sql);
    if (decision === "apply") {
      await client.query(sql);
      await client.query(
        'INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count) VALUES ($1, $2, $3, NOW(), NOW(), 1)',
        [randomUUID(), SHARED_BUDGET_SQL_SHA256, SHARED_BUDGET_MIGRATION],
      );
    }
    await client.query("COMMIT");
    return decision;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[3] !== "--apply-reviewed-shared-budget")
    throw new Error("An explicit reviewed migration command is required.");
  const manifest = JSON.parse(await readFile(new URL("./release.json", import.meta.url), "utf8"));
  if (manifest.sha !== process.argv[2] || !/^[a-f0-9]{40}$/.test(manifest.sha))
    throw new Error("Release commit mismatch.");
  const sql = await readFile(new URL(`./${SHARED_BUDGET_MIGRATION}.sql`, import.meta.url), "utf8");
  const load = createRequire(new URL("../package.json", import.meta.url));
  const { Client } = load("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema");
    if (schema) {
      await client.query("SELECT set_config('search_path', $1, false)", [
        `"${schema.replaceAll('"', '""')}"`,
      ]);
    }
    const decision = await applyReviewedSharedBudgetMigration(client, manifest, sql);
    console.log(`Reviewed shared-budget schema: ${decision}.`);
  } catch {
    console.error("Reviewed shared-budget migration failed; activation has not started.");
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
