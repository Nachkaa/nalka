"use client";

import { Container } from "@/components/layout/Container";
import { buildEventModulePath } from "@/features/events/module-navigation";
import type {
  EventModuleRouteKey,
  EventModuleSnapshot,
  EventShellNavItem,
} from "@/features/events/shell-navigation";
import { EventGiftMode } from "@prisma/client";
import { useRouter } from "next/navigation";
import React from "react";

import { EventShellNav } from "./EventShellNav";

type Props = {
  navigation: EventShellNavItem[];
  activeModule: EventModuleRouteKey;
  modules: EventModuleSnapshot[];
  eventId: string;
  eventSlug: string;
  canManageModules: boolean;
  giftMode: EventGiftMode;
  children: React.ReactNode;
};

export function EventShellClient({
  navigation,
  activeModule,
  modules,
  eventId,
  eventSlug,
  canManageModules,
  giftMode,
  children,
}: Props) {
  const router = useRouter();
  const allowedKeys = navigation.map((item) => item.key);

  const selectModule = (next: EventModuleRouteKey) => {
    if (!allowedKeys.includes(next)) return;
    router.push(buildEventModulePath(eventSlug, next), { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="border-border relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen border-b bg-white">
        <Container>
          <EventShellNav
            navigation={navigation}
            modules={modules}
            activeModule={activeModule}
            eventId={eventId}
            eventSlug={eventSlug}
            canManageModules={canManageModules}
            giftMode={giftMode}
            onSelect={selectModule}
          />
        </Container>
      </div>

      {children}
    </div>
  );
}
