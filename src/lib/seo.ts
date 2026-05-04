import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://nalka.fr";
const DEFAULT_OG_IMAGE = "/images/hero-dinner.webp";

export const siteName = "Nalka";
export const siteDescription =
  "Nalka aide les organisateurs à piloter participants, programme, décisions, budget, devis prestataires et paiements dans un espace événement clair.";

export type PublicRoute = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

export const publicRoutes: PublicRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/legal/mentions-legales", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/cgu", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/confidentialite", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.2 },
];

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    FALLBACK_SITE_URL;

  try {
    const url = new URL(raw);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (process.env.NODE_ENV === "production" && isLocalhost) {
      return FALLBACK_SITE_URL;
    }

    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function buildPublicMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName,
      title,
      description,
      url: path,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          alt: "Aperçu d'un espace événement organisé avec Nalka",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
