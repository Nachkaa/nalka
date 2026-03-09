"use client";

import { listenGlobalRefresh } from "@/lib/refresh";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return listenGlobalRefresh(() => router.refresh());
  }, [router]);

  const isHome = pathname === "/" || pathname === "/event";

  // Home = FULL WIDTH
  if (isHome) {
    return <main className="min-h-dvh">{children}</main>;
  }

  // Other pages = boxed layout
  return <main className="mx-auto min-h-dvh max-w-6xl pb-6">{children}</main>;
}
