import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  reviewSharedBudgetMigration,
  SHARED_BUDGET_MIGRATION,
  SHARED_BUDGET_SQL_SHA256,
} from "./migrate-shared-budget.mjs";

const sql = await readFile(
  new URL(`../../prisma/migrations/${SHARED_BUDGET_MIGRATION}/migration.sql`, import.meta.url),
  "utf8",
);
const baseline = {
  migration_name: "initial",
  checksum: "existing",
  finished_at: "2026-01-01",
  rolled_back_at: null,
};
const target = { name: SHARED_BUDGET_MIGRATION, checksum: SHARED_BUDGET_SQL_SHA256 };
const manifest = { migrations: [{ name: "initial", checksum: "existing" }, target] };

test("only the exact reviewed SQL may be applied, on an exact matching baseline", () => {
  assert.equal(reviewSharedBudgetMigration(manifest, [baseline], sql), "apply");
  assert.throws(() => reviewSharedBudgetMigration(manifest, [baseline], `${sql}\n-- changed`));
  assert.throws(() =>
    reviewSharedBudgetMigration(manifest, [{ ...baseline, checksum: "changed" }], sql),
  );
  assert.throws(() => reviewSharedBudgetMigration(manifest, [], sql));
  assert.throws(() =>
    reviewSharedBudgetMigration(
      { migrations: [...manifest.migrations, { name: "unreviewed", checksum: "x" }] },
      [baseline],
      sql,
    ),
  );
});

test("already applied SQL is idempotent and unresolved migrations cannot be overwritten", () => {
  const applied = {
    migration_name: target.name,
    checksum: target.checksum,
    finished_at: "2026-11-25",
    rolled_back_at: null,
  };
  assert.equal(reviewSharedBudgetMigration(manifest, [baseline, applied], sql), "already-applied");
  assert.throws(() =>
    reviewSharedBudgetMigration(manifest, [baseline, { ...applied, finished_at: null }], sql),
  );
  assert.throws(() =>
    reviewSharedBudgetMigration(manifest, [baseline, { ...applied, checksum: "changed" }], sql),
  );
});
