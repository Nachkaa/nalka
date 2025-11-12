"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listenGlobalRefresh } from "@/lib/refresh";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => listenGlobalRefresh(() => router.refresh()), [router]);

  return <>{children}</>;
}
