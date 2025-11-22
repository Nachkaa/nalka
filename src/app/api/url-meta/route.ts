import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/url";

const BAD_HOSTS = [/^localhost$/i, /^127\./, /^0\.0\.0\.0$/, /^::1$/, /\.local$/i];
const PRIVATE_IP =
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/;

function decodeHtml(input: string): string {
  let s = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  s = s.replace(/&#(\d+);/g, (_, n) =>
    String.fromCharCode(parseInt(n, 10)),
  );
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  return s.replace(/\s+/g, " ").trim();
}

// app/api/fetch-from-link/route.ts

function extractAmazonProduct(html: string, url: URL) {
  // Titre produit : <span id="productTitle">...</span>
  const titleMatch =
    html.match(/<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1]) : null;

  // Image produit : data-old-hires OU data-a-dynamic-image
  let imageUrl: string | null = null;

  const oldHiresMatch = html.match(
    /id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i,
  );
  if (oldHiresMatch?.[1]) {
    imageUrl = decodeHtml(oldHiresMatch[1]);
  } else {
    const dynMatch = html.match(
      /id=["']landingImage["'][^>]+data-a-dynamic-image=["']([^"']+)["']/i,
    );
    if (dynMatch?.[1]) {
      try {
        const jsonStr = dynMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");
        const obj = JSON.parse(jsonStr);
        const first = Object.keys(obj)[0];
        if (first) imageUrl = first;
      } catch {
        // on ignore, fallback plus bas
      }
    }
  }

  if (imageUrl) {
    if (imageUrl.startsWith("//")) {
      imageUrl = `${url.protocol}${imageUrl}`;
    } else if (imageUrl.startsWith("/")) {
      imageUrl = `${url.origin}${imageUrl}`;
    }
  }

  return { title, imageUrl };
}

/**
 * Parse Fnac product page (JSON-LD)
 */
function parseFnac(html: string, origin: URL) {
  // trouve le bloc JSON-LD
  const jsonLdMatch = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!jsonLdMatch) return null;

  let data: any;
  try {
    data = JSON.parse(jsonLdMatch[1]);
  } catch {
    return null;
  }

  // si c’est une liste, prends la première entrée “Product”
  if (Array.isArray(data)) {
    data = data.find((d) => d["@type"] === "Product") ?? data[0];
  }

  if (!data || data["@type"] !== "Product") return null;

  // nettoyage titre & description
  const title = data.name?.trim() ?? null;
  const description = data.description?.trim() ?? null;

  // image
  let imageUrl = null;
  if (Array.isArray(data.image)) {
    imageUrl = data.image[0];
  } else if (typeof data.image === "string") {
    imageUrl = data.image;
  }

  // normalisation URL d’image
  if (imageUrl?.startsWith("//")) {
    imageUrl = origin.protocol + imageUrl;
  } else if (imageUrl?.startsWith("/")) {
    imageUrl = origin.origin + imageUrl;
  }

  return {
    title,
    description,
    imageUrl,
  };
}


function extractDartyProduct(html: string, url: URL) {
  // Darty n’a pas de metas propres, on prend le <h1> produit
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1Match ? decodeHtml(h1Match[1]) : null;

  // Image : CDN static.darty.com
  const imgMatch = html.match(
    /https?:\/\/static\.darty\.com\/[^"' ]+\.(?:jpg|jpeg|png)/i,
  );
  const imageUrl = imgMatch ? imgMatch[0] : null;

  return { title, imageUrl };
}


const titleCase = (s: string) =>
  s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();

// gros sites FR/EU pour lesquels on nettoie les suffixes de titre
// Exemple: "Produit X | Fnac.com" -> "Produit X"
const ECOM_BRAND_SUFFIX = /\s*[|\-–—]\s*(Amazon(\.[a-z]+)?|Fnac(\.com)?|Darty(\.com)?|Boulanger(\.com)?|Cdiscount(\.com)?|Decathlon|Leroy\s*Merlin|Castorama|Brico\s*Dép[ôo]t|Manomano|Ikea|Maisons\s*du\s*Monde|Conforama|Zalando|Zara|H&M|Uniqlo|Mango|Asos|Vinted|Apple|Samsung|Google\s*Store|Nike|Adidas|Puma|New\s*Balance|Lego|Disney\s*Store|Micromania|Cultura|Sephora|Nocibé|Marionnaud|Kiko).*$/i;

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json(
        { error: "URL manquante" },
        { status: 400 },
      );
    }

    const safe = normalizeUrl(url);
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const tld = host.split(".").pop() ?? "";
    const brand = titleCase(host.split(".")[0]);

    if (
      BAD_HOSTS.some((r) => r.test(u.hostname)) ||
      PRIVATE_IP.test(u.hostname)
    ) {
      return NextResponse.json(
        { error: "Hôte non autorisé" },
        { status: 400 },
      );
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
    }).catch(
      (e) => new Response(null, { status: 599, statusText: String(e) }),
    );
    clearTimeout(timeout);

    if (!res || !res.ok) {
      return NextResponse.json({
        url: safe,
        title: brand,
        description: null,
        imageUrl: null,
      });
    }

    const html = (await res.text()).slice(0, 200_000);
    const pick = (re: RegExp) => html.match(re)?.[1]?.trim() ?? null;

    // ---------------- META GÉNÉRIQUE ----------------

    // on déclare en let pour pouvoir les surcharger
    let metaTitle =
      pick(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ??
      pick(/<title[^>]*>([^<]+)<\/title>/i);

    let metaDesc =
      pick(
        /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ??
      pick(
        /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );

    let metaImage =
      pick(
        /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ??
      pick(
        /<meta[^>]+property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ??
      pick(
        /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );

    console.log(metaTitle)

    // ---------------- AMAZON ----------------
    const isAmazon =
      /(^|\.)(amazon\.(fr|de|es|it|co\.uk|com))$/i.test(host);
    const isDarty = host.endsWith("darty.com");
    const isFnac = host.endsWith("fnac.com");

    if (isAmazon) {
      const { title, imageUrl } = extractAmazonProduct(html, u);
      if (title) metaTitle = title;
      if (imageUrl) metaImage = imageUrl;
    }

    if (isDarty) {
      const { title, imageUrl } = extractDartyProduct(html, u);
      if (title) metaTitle = title;
      if (imageUrl) metaImage = imageUrl;
    }

    if (host.includes("fnac.")) {
      const parsed = parseFnac(html, u);
      if (parsed) {
        return NextResponse.json({
          url: safe,
          title: parsed.title,
          description: parsed.description,
          imageUrl: parsed.imageUrl,
        });
      }
    }

    // ---------------- NORMALISATION GÉNÉRALE ----------------

    const t = metaTitle ? decodeHtml(metaTitle) : null;
    const d = metaDesc ? decodeHtml(metaDesc) : null;

    let imageUrl = metaImage ? decodeHtml(metaImage) : null;

    if (imageUrl) {
      if (imageUrl.startsWith("//")) {
        imageUrl = `${u.protocol}${imageUrl}`;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = `${u.origin}${imageUrl}`;
      }
    }

    const lower = (s: string) => s.toLowerCase();
    const brandDot = `${brand}.${tld}`.toLowerCase();

    let finalTitle =
      !t ||
        lower(t) === host ||
        lower(t) === brandDot ||
        lower(t) === `${brand.toLowerCase()} ${tld}`
        ? brand
        : t;

    let finalDesc =
      !d || lower(d) === host || lower(d) === brandDot ? null : d;

    // strip suffixes e-commerce du type " | Fnac.com", " - Darty.com", etc.
    if (finalTitle && ECOM_BRAND_SUFFIX.test(finalTitle)) {
      finalTitle = finalTitle.replace(ECOM_BRAND_SUFFIX, "").trim();
    }

    // cas particulier Amazon: encore un nettoyage éventuel du " : Amazon.fr: XXX"
    if (host.startsWith("amazon.")) {
      if (finalTitle) {
        finalTitle = finalTitle
          .replace(/:\s*Amazon\.[a-z.]+.*$/i, "")
          .trim();
      }
    }

    return NextResponse.json({
      url: safe,
      title: finalTitle?.slice(0, 120) ?? null,
      description: finalDesc?.slice(0, 500) ?? null,
      imageUrl: imageUrl ?? null,
    });
  } catch {
    return NextResponse.json({
      url: null,
      title: null,
      description: null,
      imageUrl: null,
    });
  }
}
