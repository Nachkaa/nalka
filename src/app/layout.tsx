import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { StructuredData } from "@/components/seo/StructuredData";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import SiteHeader from "@/components/site-header";
import { absoluteUrl, getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import { AskNameDialog } from "@/components/user/AskNameDialog";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ClientLayout } from "./ClientLayout";
import Providers from "./providers";

const inter = localFont({
  src: [
    {
      path: "../assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nalka",
    template: "%s | Nalka",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName,
    title: "Nalka",
    description: siteDescription,
    images: [
      {
        url: "/images/hero-dinner.webp",
        alt: "Apercu d'un evenement prive sur Nalka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nalka",
    description: siteDescription,
    images: ["/images/hero-dinner.webp"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  headers(); // force dynamic rendering (nonce per request)

  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen">
        <StructuredData
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteName,
              url: siteUrl,
              email: "contact@nalka.fr",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteName,
              url: absoluteUrl("/"),
              inLanguage: "fr-FR",
            },
          ]}
        />
        <Providers>
          <SiteHeader />

          <AskNameDialog />

          <main className="min-h-dvh">
            <ClientLayout>{children}</ClientLayout>
          </main>
        </Providers>

        <Footer />
        <CookieConsent />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
