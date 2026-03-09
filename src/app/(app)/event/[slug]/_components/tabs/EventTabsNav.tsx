"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarClock,
  Gift,
  Home,
  MessageSquare,
  PiggyBank,
  Settings,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { ModuleManagerDialog } from "./ModuleManagerDialog";
import type { EventModuleSnapshot, EventTabDefinition, EventTabKey } from "./event-tabs.config";
import { EventGiftMode } from "@prisma/client";

type Props = {
  tabs: EventTabDefinition[];
  modules: EventModuleSnapshot[];
  activeTab: EventTabKey;
  eventId: string;
  eventSlug: string;
  canManageModules: boolean;
  giftMode: EventGiftMode;
  onSelect: (key: EventTabKey) => void;
};

export function EventTabsNav({
  tabs,
  modules,
  activeTab,
  eventId,
  eventSlug,
  canManageModules,
  giftMode,
  onSelect,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const renderIcon = (key: EventTabKey) => {
    switch (key) {
      case "overview":
        return <Home className="h-4 w-4" aria-hidden />;
      case "gifts":
        return <Gift className="h-4 w-4" aria-hidden />;
      case "secret-santa":
        return <Sparkles className="h-4 w-4" aria-hidden />;
      case "potluck":
        return <UtensilsCrossed className="h-4 w-4" aria-hidden />;
      case "timeline":
        return <CalendarClock className="h-4 w-4" aria-hidden />;
      case "expenses":
        return <PiggyBank className="h-4 w-4" aria-hidden />;
      case "polls":
        return <BarChart3 className="h-4 w-4" aria-hidden />;
      case "chat":
        return <MessageSquare className="h-4 w-4" aria-hidden />;
      default:
        return null;
    }
  };

  return (
    <nav aria-label="Navigation des modules" className="overflow-hidden bg-white">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* remove overflow-x-auto here */}
            <div role="tablist" className="flex gap-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                const badge = tab.badge ?? null;

                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelect(tab.key)}
                    className={cn(
                      // base
                      "relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap",
                      "text-muted-foreground hover:text-foreground",
                      "cursor-pointer transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none",
                      // active
                      isActive && "text-foreground",
                    )}
                  >
                    <span aria-hidden className="text-[15px] leading-none opacity-80">
                      {renderIcon(tab.iconKey)}
                    </span>

                    <span>{tab.label}</span>

                    {badge !== null ? (
                      <span className="border-border bg-muted text-foreground ml-1 inline-flex items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold">
                        {badge}
                      </span>
                    ) : null}

                    {/* underline */}
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
          onOpenChange={setDialogOpen}
          modules={modules}
          eventId={eventId}
          eventSlug={eventSlug}
          giftMode={giftMode}
        />
      ) : null}
    </nav>
  );
}
