"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="nalka-theme"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
