import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal/"],
      disallow: ["/api/", "/event", "/event/", "/join", "/login", "/profile"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
