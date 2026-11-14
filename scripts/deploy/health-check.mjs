import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export async function checkHealth(baseUrl, sha) {
  const response = await fetch(new URL("/api/health", baseUrl), {
    signal: AbortSignal.timeout(5000),
    redirect: "error",
    cache: "no-store",
  });
  if (response.status !== 200) throw new Error("Readiness failed.");
  const body = await response.json();
  if (body.status !== "ok" || body.release !== sha) throw new Error("Unexpected release.");
  const login = await fetch(new URL("/login", baseUrl), {
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (login.status !== 200) throw new Error("Login page failed.");
  const html = await login.text();
  const asset = html.match(/(?:src|href)="(\/_next\/static\/[^"?]+)(?:\?[^"\s]*)?"/);
  if (!asset) throw new Error("Login page is missing static assets.");
  const staticResponse = await fetch(new URL(asset[1], baseUrl), {
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (staticResponse.status !== 200) throw new Error("Static asset failed.");
  await staticResponse.body?.cancel();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [baseUrl, sha] = process.argv.slice(2);
  if (!baseUrl || !/^[a-f0-9]{40}$/.test(sha ?? ""))
    throw new Error("Expected base URL and release SHA.");
  let healthy = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await checkHealth(baseUrl, sha);
      healthy = true;
      break;
    } catch {
      if (attempt < 19) await setTimeout(2000);
    }
  }
  if (!healthy) {
    console.error(`Release health check failed for ${new URL(baseUrl).origin}.`);
    process.exitCode = 1;
  } else {
    console.log(`Release ${sha} is healthy at ${new URL(baseUrl).origin}.`);
  }
}
