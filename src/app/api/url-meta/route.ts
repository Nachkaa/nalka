// UPDATE: return normalized url, brand fallback, fix "Amazon.fr" -> "Amazon",
// and avoid &nbsp; in both fields.

import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/url";

const BAD_HOSTS = [/^localhost$/i, /^127\./, /^0\.0\.0\.0$/, /^::1$/, /\.local$/i];
const PRIVATE_IP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/;

function decodeHtml(input: string): string {
  let s = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return s.replace(/\s+/g, " ").trim();
}

const titleCase = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    const safe = normalizeUrl(url);
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const tld = host.split(".").pop() ?? "";
    const brand = titleCase(host.split(".")[0]);

    if (BAD_HOSTS.some((r) => r.test(u.hostname)) || PRIVATE_IP.test(u.hostname)) {
      return NextResponse.json({ error: "Hôte non autorisé" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(safe, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "NalkaLinkPreview/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    }).catch((e) => new Response(null, { status: 599, statusText: String(e) }));
    clearTimeout(timeout);

    if (!res || !res.ok) {
      return NextResponse.json({
        url: safe,
        title: brand,
        description: null,
        imageUrl: null, // NEW
      });
    }

    const html = (await res.text()).slice(0, 200_000);
    const pick = (re: RegExp) => html.match(re)?.[1]?.trim() ?? null;

    // metas
    const metaTitle =
      pick(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<title[^>]*>([^<]+)<\/title>/i);

    const metaDesc =
      pick(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    // NEW: image (og:image / twitter:image)
    const metaImage =
      pick(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<meta[^>]+property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    // clean
    const t = metaTitle ? decodeHtml(metaTitle) : null;
    const d = metaDesc ? decodeHtml(metaDesc) : null;

    let imageUrl = metaImage ? decodeHtml(metaImage) : null;

    // normalisation des URLs d'image relatives / protocol-relative
    if (imageUrl) {
      if (imageUrl.startsWith("//")) {
        imageUrl = `${u.protocol}${imageUrl}`;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = `${u.origin}${imageUrl}`;
      }
    }

    // Normalize brandy titles like "Amazon.fr" -> "Amazon"
    const lower = (s: string) => s.toLowerCase();
    const brandDot = `${brand}.${tld}`.toLowerCase();
    let finalTitle =
      !t || lower(t) === host || lower(t) === brandDot || lower(t) === `${brand.toLowerCase()} ${tld}`
        ? brand
        : t;

    let finalDesc = !d || lower(d) === host || lower(d) === brandDot ? brand : d;

    return NextResponse.json({
      url: safe,
      title: finalTitle?.slice(0, 120) ?? null,
      description: finalDesc?.slice(0, 500) ?? null,
      imageUrl: imageUrl ?? null, // NEW
    });
  } catch {
    return NextResponse.json({ url: null, title: null, description: null, imageUrl: null }); // NEW
  }
}
