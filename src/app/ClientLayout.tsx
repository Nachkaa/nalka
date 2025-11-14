"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listenGlobalRefresh } from "@/lib/refresh";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return listenGlobalRefresh(() => router.refresh());
  }, [router]);

  const isHome = pathname === "/";

  // Home = FULL WIDTH
  if (isHome) {
    return (
      <main className="min-h-dvh">
        {children}
      </main>
    );
  }

  // Other pages = boxed layout
  return (
    <main className="mx-auto max-w-6xl p-6 min-h-dvh">
      {children}
    </main>
  );
}
