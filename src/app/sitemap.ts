import type { MetadataRoute } from "next";

import { absoluteUrl, publicRoutes } from "@/lib/seo";

const SITEMAP_SIZE = 5000;

export async function generateSitemaps() {
  return Array.from(
    { length: Math.max(1, Math.ceil(publicRoutes.length / SITEMAP_SIZE)) },
    (_, id) => ({ id }),
  );
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const start = id * SITEMAP_SIZE;
  const end = start + SITEMAP_SIZE;

  return publicRoutes.slice(start, end).map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    lastModified: new Date(),
  }));
}
