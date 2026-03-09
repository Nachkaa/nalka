"use client";

import { Container } from "@/components/layout/Container";
import { EventGiftMode } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import { EventTabsNav } from "./EventTabsNav";
import type { EventTabDefinition, EventTabKey, EventModuleSnapshot } from "./event-tabs.config";

type Props = {
  tabs: EventTabDefinition[];
  activeTab: EventTabKey;
  modules: EventModuleSnapshot[];
  eventId: string;
  eventSlug: string;
  canManageModules: boolean;
  giftMode: EventGiftMode;
  children: React.ReactNode;
};

export function EventShellClient({
  tabs,
  activeTab,
  modules,
  eventId,
  eventSlug,
  canManageModules,
  giftMode,
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const defaultTab = useMemo(
    () => tabs.find((t) => t.key === "overview")?.key ?? tabs[0]?.key ?? "overview",
    [tabs],
  );

  const setTab = (next: EventTabKey) => {
    if (!allowedKeys.includes(next)) return;

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === defaultTab) params.delete("tab");
    else params.set("tab", next);
    const url = params.size ? `${pathname}?${params.toString()}` : pathname;
    router.push(url, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
        <Container className="">
          <EventTabsNav
            tabs={tabs}
            modules={modules}
            activeTab={activeTab}
            eventId={eventId}
            eventSlug={eventSlug}
            canManageModules={canManageModules}
            giftMode={giftMode}
            onSelect={setTab}
          />
        </Container>
      </div>

      {children}
    </div>
  );
}
