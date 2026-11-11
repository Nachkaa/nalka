export function assertCompatibleMigrations(expected, actual) {
  const completed = new Map();
  for (const row of actual) {
    if (row.rolled_back_at) continue;
    if (!row.finished_at) throw new Error("An unresolved database migration blocks deployment.");
    completed.set(row.migration_name, row.checksum);
  }
  if (
    completed.size !== expected.length ||
    expected.some((row) => completed.get(row.name) !== row.checksum)
  ) {
    throw new Error(
      "Database migration history differs from this release. Migrate separately before deploying.",
    );
  }
}
