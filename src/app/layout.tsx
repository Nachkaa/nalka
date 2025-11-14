import "./globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";
import SiteHeader from "@/components/site-header";
import { inter, lora } from "@/styles/fonts";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { ClientLayout } from "./ClientLayout";

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
          
          {/* IMPORTANT : le main ne doit PAS boxer la homepage */}
          <main className="min-h-dvh">
            <ClientLayout>{children}</ClientLayout>
          </main>

        </Providers>

        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
