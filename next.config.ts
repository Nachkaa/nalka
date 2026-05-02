// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dma.canyon.com" },
      // si tu récupères souvent des images d'autres domaines, ajoute-les ici au fur et à mesure
    ],
  },
};

export default nextConfig;
