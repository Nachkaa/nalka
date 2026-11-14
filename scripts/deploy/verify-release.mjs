import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { assertCompatibleMigrations } from "./migrations.mjs";

const manifest = JSON.parse(await readFile(new URL("./release.json", import.meta.url), "utf8"));
if (manifest.sha !== process.argv[2] || !/^[a-f0-9]{40}$/.test(manifest.sha)) {
  throw new Error("Release commit mismatch.");
}
if (Number(process.versions.node.split(".")[0]) !== manifest.nodeMajor) {
  throw new Error("This release requires Node.js 22.");
}
if (!process.env.DATABASE_URL || !(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)) {
  throw new Error("Database or authentication configuration is missing.");
}
if (process.env.NALKA_VERIFY_PRODUCTION === "1") {
  const validOrigin = (value) => value?.replace(/\/$/, "") === "https://nalka.fr";
  if (!validOrigin(process.env.AUTH_URL) || !validOrigin(process.env.NEXTAUTH_URL)) {
    throw new Error("AUTH_URL and NEXTAUTH_URL must point to https://nalka.fr.");
  }
  if (
    (process.env.MAIL_MODE ?? "smtp") !== "smtp" ||
    !process.env.MAIL_FROM ||
    !(process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST) ||
    !(process.env.SMTP_USER || process.env.EMAIL_SERVER_USER) ||
    !(process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD)
  ) {
    throw new Error("Production SMTP configuration is missing or mail mode is not smtp.");
  }
}
const load = createRequire(new URL("../package.json", import.meta.url));
const { PrismaClient } = load("@prisma/client");
const prisma = new PrismaClient({ log: [] });
try {
  const rows =
    await prisma.$queryRaw`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`;
  assertCompatibleMigrations(manifest.migrations, rows);
  console.log("Release runtime and database migration history verified.");
} catch {
  console.error(
    "Release verification failed. Check database connectivity and migration history; no migrations were applied.",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
