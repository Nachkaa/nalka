import "./globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";
import SiteHeader from "@/components/site-header";
import { inter, lora } from "@/styles/fonts";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { ClientLayout } from "./ClientLayout";
import { AskNameDialog } from "@/components/user/AskNameDialog";

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

          {/* Demande de prénom si l’utilisateur n’en a pas */}
          <AskNameDialog />

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
