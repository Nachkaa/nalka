import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { assertCompatibleMigrations } from "./migrations.mjs";
import { checkHealth } from "./health-check.mjs";

const sha = "a".repeat(40);
const releaseId = `${sha}-123-1`;
const script = fileURLToPath(new URL("./activate-release.sh", import.meta.url));
const expected = [{ name: "initial", checksum: "abc" }];
const applied = {
  migration_name: "initial",
  checksum: "abc",
  finished_at: "2026-11-11",
  rolled_back_at: null,
};

test("migration gate accepts matching history and ignores resolved rollbacks", () => {
  assert.doesNotThrow(() =>
    assertCompatibleMigrations(expected, [
      applied,
      { ...applied, finished_at: null, rolled_back_at: "2026-11-10" },
    ]),
  );
});

test("migration gate rejects pending, changed, extra and unresolved migrations", () => {
  for (const rows of [
    [],
    [{ ...applied, checksum: "changed" }],
    [applied, { ...applied, migration_name: "extra" }],
    [{ ...applied, finished_at: null }],
  ]) {
    assert.throws(() => assertCompatibleMigrations(expected, rows));
  }
});

test("health gate requires the exact release, working database, login and assets", async (t) => {
  let mode = "healthy";
  const server = createServer((request, response) => {
    if (request.url === "/api/health") {
      if (mode === "redirect") {
        response.writeHead(302, { location: "/login" });
        response.end();
        return;
      }
      response.writeHead(mode === "database" ? 503 : 200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({ status: "ok", release: mode === "stale" ? "b".repeat(40) : sha }),
      );
    } else if (request.url === "/login") {
      response.writeHead(mode === "login" ? 500 : 200);
      response.end(
        mode === "missing-asset" ? "no asset" : '<script src="/_next/static/test.js"></script>',
      );
    } else {
      response.writeHead(mode === "asset" ? 404 : 200);
      response.end("fixture");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  await checkHealth(baseUrl, sha);
  for (mode of ["stale", "database", "login", "missing-asset", "asset", "redirect"]) {
    await assert.rejects(checkHealth(baseUrl, sha), mode);
  }
});

async function deploymentFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "nalka-deploy-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of [
    "releases/legacy",
    "incoming",
    "shared/gift-images",
    "shared/event-images",
    "fixture/public",
    "fixture/.deploy",
    "bin",
  ]) {
    await mkdir(path.join(root, dir), { recursive: true });
  }
  await writeFile(path.join(root, "shared/runtime.env"), "AUTH_SECRET=fixture\n");
  await writeFile(path.join(root, "shared/gift-images/existing.webp"), "preserve upload");
  await symlink(path.join(root, "releases/legacy"), path.join(root, "current"));
  await writeFile(path.join(root, "fixture/server.js"), "// fixture\n");
  await writeFile(path.join(root, "fixture/.deploy/release.env"), `NALKA_RELEASE_SHA=${sha}\n`);
  await writeFile(
    path.join(root, "fixture/.deploy/verify-release.mjs"),
    'if (process.env.TEST_FAIL === "schema") process.exit(1);\n',
  );
  await writeFile(
    path.join(root, "fixture/.deploy/health-check.mjs"),
    `
    const url = process.argv[2];
    const fail = process.env.TEST_FAIL;
    if (fail === 'signal' && url.endsWith(':3000')) process.kill(process.ppid, 'SIGHUP');
    if ((fail === 'preview' && url.endsWith(':3001')) || (fail === 'production' && url.endsWith(':3000')) || (fail === 'public' && url === 'https://nalka.fr')) process.exit(1);
  `,
  );
  await writeFile(
    path.join(root, "bin/sudo"),
    `#!/usr/bin/env bash
set -eu
[[ "$1" == -n && "$2" == /usr/local/sbin/nalka-release-service ]]
printf '%s %s\\n' "$3" "\${4:-}" >> "$NALKA_DEPLOY_ROOT/events"
if [[ "$3" == restart && "\${TEST_FAIL:-}" == restart && ! -e "$NALKA_DEPLOY_ROOT/first-restart" ]]; then
  touch "$NALKA_DEPLOY_ROOT/first-restart"
  exit 1
fi
`,
    { mode: 0o755 },
  );
  await writeFile(path.join(root, "bin/curl"), "#!/usr/bin/env bash\nexit 0\n", { mode: 0o755 });
  const archive = path.join(root, "incoming", `${releaseId}.tar.gz`);
  const packed = spawnSync("tar", ["-czf", archive, "-C", path.join(root, "fixture"), "."], {
    encoding: "utf8",
  });
  assert.equal(packed.status, 0, packed.stderr);
  const checksum = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  const run = (failure = "", hash = checksum) =>
    spawnSync("bash", [script, sha, releaseId, hash], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${root}/bin:${process.env.PATH}`,
        NALKA_DEPLOY_ROOT: root,
        NALKA_NODE: process.execPath,
        TEST_FAIL: failure,
      },
      timeout: 10000,
    });
  return { root, run, checksum };
}

test("activation checks preview before switching and preserves uploaded files", async (t) => {
  const { root, run } = await deploymentFixture(t);
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readlink(path.join(root, "current")), path.join(root, "releases", releaseId));
  assert.equal(await readlink(path.join(root, "previous")), path.join(root, "releases/legacy"));
  assert.equal(
    await readlink(path.join(root, "releases", releaseId, "public/gift-images")),
    path.join(root, "shared/gift-images"),
  );
  assert.equal(
    await readFile(path.join(root, "shared/gift-images/existing.webp"), "utf8"),
    "preserve upload",
  );
  assert.equal(
    await readFile(path.join(root, "events"), "utf8"),
    `preview-start ${releaseId}\npreview-stop ${releaseId}\nrestart \n`,
  );
});

for (const failure of ["schema", "preview", "production", "public", "restart", "signal"]) {
  test(`${failure} failure preserves or restores the previous release`, async (t) => {
    const { root, run } = await deploymentFixture(t);
    const result = run(failure);
    assert.notEqual(result.status, 0);
    assert.equal(await readlink(path.join(root, "current")), path.join(root, "releases/legacy"));
    if (["production", "public", "restart", "signal"].includes(failure)) {
      assert.match(result.stderr, /Previous release restored/);
    }
  });
}

test("a corrupted archive is rejected before activation", async (t) => {
  const { root, run } = await deploymentFixture(t);
  assert.notEqual(run("", "0".repeat(64)).status, 0);
  assert.equal(await readlink(path.join(root, "current")), path.join(root, "releases/legacy"));
});

test("rollback survives a disconnected output channel", async (t) => {
  const { root, checksum } = await deploymentFixture(t);
  const child = spawn("bash", [script, sha, releaseId, checksum], {
    env: {
      ...process.env,
      PATH: `${root}/bin:${process.env.PATH}`,
      NALKA_DEPLOY_ROOT: root,
      NALKA_NODE: process.execPath,
      TEST_FAIL: "signal",
    },
    timeout: 10000,
  });
  child.stdout.destroy();
  child.stderr.destroy();
  const [code] = await once(child, "close");
  assert.notEqual(code, 0);
  assert.equal(await readlink(path.join(root, "current")), path.join(root, "releases/legacy"));
});

test("root service helper rejects arbitrary units and malformed release IDs", () => {
  const helper = fileURLToPath(new URL("./service-control.sh", import.meta.url));
  for (const args of [
    ["restart", "postgresql.service"],
    ["preview-start", "../../postgresql"],
    ["start", releaseId],
  ]) {
    const result = spawnSync("bash", [helper, ...args], { encoding: "utf8" });
    assert.equal(result.status, 2);
  }
});
