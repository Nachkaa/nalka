import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sha = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(sha ?? ""))
  throw new Error("GITHUB_SHA must identify the release commit.");
const root = process.cwd();
const release = path.join(root, ".next/standalone");
await readFile(path.join(release, "server.js"));
if ((await readdir(release)).some((name) => name === ".env" || name.startsWith(".env."))) {
  throw new Error("Refusing to package environment files.");
}

await cp(path.join(root, "public"), path.join(release, "public"), {
  recursive: true,
  filter: (source) =>
    !["gift-images", "event-images"].includes(
      path.relative(path.join(root, "public"), source).split(path.sep)[0],
    ),
});
await cp(path.join(root, ".next/static"), path.join(release, ".next/static"), { recursive: true });
await mkdir(path.join(release, ".deploy"), { recursive: true });
for (const file of ["migrations.mjs", "verify-release.mjs", "health-check.mjs"]) {
  await cp(path.join(root, "scripts/deploy", file), path.join(release, ".deploy", file));
}

const migrations = [];
for (const entry of await readdir(path.join(root, "prisma/migrations"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const sql = await readFile(path.join(root, "prisma/migrations", entry.name, "migration.sql"));
  migrations.push({ name: entry.name, checksum: createHash("sha256").update(sql).digest("hex") });
}
migrations.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(
  path.join(release, ".deploy/release.json"),
  JSON.stringify({ sha, nodeMajor: 22, migrations }),
);
await writeFile(path.join(release, ".deploy/release.env"), `NALKA_RELEASE_SHA=${sha}\n`);
console.log(`Packaged standalone release ${sha}.`);
