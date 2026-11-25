import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import {
  applyReviewedSharedBudgetMigration,
  SHARED_BUDGET_MIGRATION,
} from "../deploy/migrate-shared-budget.mjs";

const database = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (
  process.env.NALKA_TEST_DATABASE !== "1" ||
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  database.pathname !== "/nalka_ci"
) {
  throw new Error("Migration smoke requires the isolated local nalka_ci fixture database.");
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const migrations = [];
for (const entry of await readdir(new URL("../../prisma/migrations/", import.meta.url), {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  const sql = await readFile(
    new URL(`../../prisma/migrations/${entry.name}/migration.sql`, import.meta.url),
  );
  migrations.push({ name: entry.name, checksum: createHash("sha256").update(sql).digest("hex") });
}
const manifest = { migrations };
const sql = await readFile(
  new URL(`../../prisma/migrations/${SHARED_BUDGET_MIGRATION}/migration.sql`, import.meta.url),
  "utf8",
);
await client.connect();
try {
  for (const failure of [false, true]) {
    const schema = `ci_shared_budget_${randomUUID().replaceAll("-", "")}`;
    await client.query(`CREATE SCHEMA "${schema}"`);
    try {
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(
        'CREATE TABLE "_prisma_migrations" (LIKE public."_prisma_migrations" INCLUDING ALL)',
      );
      await client.query(
        'INSERT INTO "_prisma_migrations" SELECT * FROM public."_prisma_migrations" WHERE migration_name <> $1',
        [SHARED_BUDGET_MIGRATION],
      );
      await client.query(
        'CREATE TABLE "Event" (id TEXT PRIMARY KEY); CREATE TABLE "User" (id TEXT PRIMARY KEY); CREATE TABLE "EventRelative" (id TEXT PRIMARY KEY)',
      );
      if (failure) {
        await client.query('CREATE TABLE "SharedExpenseShare" (id TEXT)');
        await assert.rejects(applyReviewedSharedBudgetMigration(client, manifest, sql));
        const result = await client.query(
          "SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename IN ('SharedExpense', 'SharedBudgetParticipant')",
          [schema],
        );
        assert.equal(result.rowCount, 0, "DDL before the failure must be rolled back");
        assert.equal(
          (
            await client.query('SELECT id FROM "_prisma_migrations" WHERE migration_name = $1', [
              SHARED_BUDGET_MIGRATION,
            ])
          ).rowCount,
          0,
        );
      } else {
        assert.equal(await applyReviewedSharedBudgetMigration(client, manifest, sql), "apply");
        assert.equal(
          await applyReviewedSharedBudgetMigration(client, manifest, sql),
          "already-applied",
        );
        assert.equal(
          (
            await client.query(
              'SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL',
              [SHARED_BUDGET_MIGRATION],
            )
          ).rowCount,
          1,
        );
        const result = await client.query(
          "SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename IN ('SharedExpense', 'SharedBudgetParticipant', 'SharedExpenseShare', 'SharedRepayment')",
          [schema],
        );
        assert.equal(result.rowCount, 4);
      }
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    }
  }
  console.log(
    "Reviewed shared-budget migration passed: real PostgreSQL application, idempotency, transactional DDL and history rollback on failure.",
  );
} finally {
  await client.end();
}
