const TRACKING_KEYS = new Set([
  "gclid",
  "dclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_",
  "igshid",
  "si",
  "spm",
  "trk",
]);

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PRIVATE_IPV4 = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^169\.254\./];
const PRIVATE_IPV6 = [/^fc/i, /^fd/i, /^fe80/i];

export function normalizeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("URL manquante");

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    throw new Error("URL invalide");
  } 

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Protocole non autorisé");
  }

  // Normalize host
  u.hostname = u.hostname.toLowerCase();

  // Remove credentials and fragment
  u.username = "";
  u.password = "";
  u.hash = "";

  // Drop default ports
  if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) {
    u.port = "";
  }

  // Normalize path: collapse repeated slashes (keep leading slash)
  u.pathname = u.pathname.replace(/\/{2,}/g, "/");

  // Remove tracking params
  const params = u.searchParams;
  for (const key of Array.from(params.keys())) {
    if (key.startsWith("utm_") || TRACKING_KEYS.has(key)) {
      params.delete(key);
    }
  }
  // Re-assign to trigger URL internals update
  u.search = params.toString() ? `?${params.toString()}` : "";

  // Optional: drop trailing slash except root
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  const out = u.toString();
  if (out.length > 2000) throw new Error("URL trop longue");

  return out;
}

export function validateGiftUrlOrThrow(raw: string): string {
  const url = normalizeUrl(raw); // adds https:// if missing, enforces http/https, strips junk
  const u = new URL(url);

  const host = u.hostname.toLowerCase();
  if (!host.includes(".")) throw new Error("Nom de domaine invalide");
  if (PRIVATE_HOSTS.has(host)) throw new Error("Hôte interdit");
  if (PRIVATE_IPV4.some((r) => r.test(host))) throw new Error("Hôte privé interdit");
  if (PRIVATE_IPV6.some((r) => r.test(host))) throw new Error("Hôte privé interdit");

  // Drop fragments already done. Also strip default ports already handled by normalizeUrl.
  return u.toString();
}