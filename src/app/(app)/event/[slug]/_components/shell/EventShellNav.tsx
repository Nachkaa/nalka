"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  EventModuleRouteKey,
  EventModuleSnapshot,
  EventShellNavItem,
} from "@/features/events/shell-navigation";
import { EventGiftMode, EventModuleKey } from "@prisma/client";
import {
  BarChart3,
  CalendarClock,
  Gift,
  Home,
  MessageSquare,
  ReceiptEuro,
  Settings,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ModuleManagerDialog } from "./ModuleManagerDialog";

type Props = {
  navigation: EventShellNavItem[];
  modules: EventModuleSnapshot[];
  activeModule: EventModuleRouteKey;
  eventId: string;
  eventSlug: string;
  canManageModules: boolean;
  giftMode: EventGiftMode;
  onSelect: (key: EventModuleRouteKey) => void;
};

const MODULE_ICONS: Record<EventModuleRouteKey, ReactNode> = {
  overview: <Home className="h-4 w-4" aria-hidden />,
  gifts: <Gift className="h-4 w-4" aria-hidden />,
  "secret-santa": <Sparkles className="h-4 w-4" aria-hidden />,
  potluck: <UtensilsCrossed className="h-4 w-4" aria-hidden />,
  timeline: <CalendarClock className="h-4 w-4" aria-hidden />,
  budget: <ReceiptEuro className="h-4 w-4" aria-hidden />,
  polls: <BarChart3 className="h-4 w-4" aria-hidden />,
  chat: <MessageSquare className="h-4 w-4" aria-hidden />,
};

export function EventShellNav({
  navigation,
  modules,
  activeModule,
  eventId,
  eventSlug,
  canManageModules,
  giftMode,
  onSelect,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedConfigKey =
    searchParams?.get("configure") === "gifts" ? EventModuleKey.GIFTS : null;
  const [dialogOpen, setDialogOpen] = useState(Boolean(requestedConfigKey));

  useEffect(() => {
    if (requestedConfigKey) {
      setDialogOpen(true);
    }
  }, [requestedConfigKey]);

  const handleDialogOpenChange = (next: boolean) => {
    setDialogOpen(next);

    if (!next && requestedConfigKey) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("configure");
      const url = params.size ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url, { scroll: false });
    }
  };

  return (
    <nav aria-label="Navigation des modules" className="overflow-hidden bg-white">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div role="tablist" className="flex gap-2">
              {navigation.map((item) => {
                const isActive = item.key === activeModule;
                const badge = item.badge ?? null;

                return (
                  <button
                    key={item.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelect(item.key)}
                    className={cn(
                      "relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap",
                      "text-muted-foreground hover:text-foreground",
                      "cursor-pointer transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none",
                      isActive && "text-foreground",
                    )}
                  >
                    <span aria-hidden className="text-[15px] leading-none opacity-80">
                      {MODULE_ICONS[item.iconKey]}
                    </span>

                    <span>{item.label}</span>

                    {badge !== null ? (
                      <span className="border-border bg-muted text-foreground ml-1 inline-flex items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold">
                        {badge}
                      </span>
                    ) : null}

                    <span
                      aria-hidden
                      className={cn(
                        "absolute right-2 -bottom-px left-2 h-1 rounded-full transition",
                        isActive ? "bg-(--primary-700)" : "bg-transparent",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {canManageModules ? (
          <div className="ml-auto flex items-center gap-3">
            <Separator orientation="vertical" className="h-5" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden h-9 px-3 sm:inline-flex"
              onClick={() => setDialogOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" aria-hidden />
              Modules
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-9 w-9 sm:hidden"
              aria-label="Ajouter un module"
              onClick={() => setDialogOpen(true)}
            >
              <Settings className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {canManageModules ? (
        <ModuleManagerDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          modules={modules}
          activeModule={activeModule}
          eventId={eventId}
          eventSlug={eventSlug}
          giftMode={giftMode}
          requestedConfigKey={requestedConfigKey}
        />
      ) : null}
    </nav>
  );
}
