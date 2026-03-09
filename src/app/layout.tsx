import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import SiteHeader from "@/components/site-header";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  headers(); // force dynamic rendering (nonce per request)

  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen">
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
