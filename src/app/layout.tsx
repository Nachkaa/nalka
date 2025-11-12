import "./globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";
import SiteHeader from "@/components/site-header";
import { inter, lora } from "@/styles/fonts";
import { ClientLayout } from "./ClientLayout";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-6xl p-6">
            <ClientLayout>{children}</ClientLayout>
          </main>
        </Providers>
        <Footer />
        <CookieConsent />
      </body>     
    </html>
  );
}
