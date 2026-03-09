// src/app/(app)/event/[slug]/_components/whats-next/WhatsNextSection.tsx
"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileText,
  Gift,
  MapPin,
  PiggyBank,
  UtensilsCrossed,
} from "lucide-react";
import * as React from "react";
import { buildWhatsNextItems } from "./buildWhatsNextItems";
import type { WhatsNextIconKey, WhatsNextInput, WhatsNextItem } from "./types";

// Si tu as viré WhatsNextClickHandler, garde ça simple :
type WhatsNextClickHandler = (item: WhatsNextItem) => void;

const statusClasses: Record<NonNullable<WhatsNextItem["status"]>, string> = {
  todo: "bg-primary/10 text-primary",
  info: "bg-muted text-muted-foreground",
  ok: "bg-emerald-100 text-emerald-800",
};

function renderIcon(icon?: WhatsNextIconKey) {
  switch (icon) {
    case "rsvp":
      return <CheckCircle2 className="h-4 w-4" aria-hidden />;
    case "date":
      return <CalendarClock className="h-4 w-4" aria-hidden />;
    case "location":
      return <MapPin className="h-4 w-4" aria-hidden />;
    case "description":
      return <FileText className="h-4 w-4" aria-hidden />;
    case "poll":
      return <BarChart3 className="h-4 w-4" aria-hidden />;
    case "gifts":
      return <Gift className="h-4 w-4" aria-hidden />;
    case "potluck":
      return <UtensilsCrossed className="h-4 w-4" aria-hidden />;
    case "expenses":
      return <PiggyBank className="h-4 w-4" aria-hidden />;
    default:
      return null;
  }
}

function WhatsNextCard({
  item,
  onClick,
  clickable = false,
}: {
  item: WhatsNextItem;
  onClick?: WhatsNextClickHandler;
  clickable?: boolean;
}) {
  const inner = (
    <div className="border-border bg-card/70 flex items-start gap-3 rounded-xl border p-3 shadow-sm">
      {item.icon ? (
        <div className="bg-primary/10 text-primary rounded-lg p-2" aria-hidden>
          {renderIcon(item.icon)}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-foreground text-sm font-semibold">{item.title}</p>

          {item.statusLabel ? (
            <span
              className={cn(
                "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                item.status ? statusClasses[item.status] : "bg-muted text-muted-foreground",
              )}
            >
              {item.statusLabel}
            </span>
          ) : null}
        </div>

        <p className="text-muted-foreground text-xs">{item.description}</p>
      </div>
    </div>
  );

  if (!clickable) return inner;

  return (
    <button type="button" className="text-left" onClick={() => onClick?.(item)}>
      {inner}
    </button>
  );
}

export function WhatsNextSection({
  input,
  onItemClick,
  title = "Les prochaines étapes pour que tout soit prêt.",
  subtitle = "Les prochaines étapes pour que tout soit prêt.",
  className,
  clickable = false,
  hideWhenEmpty = true, // <= important pour ton besoin
}: {
  input: WhatsNextInput;
  onItemClick?: WhatsNextClickHandler;
  title?: string;
  subtitle?: string;
  className?: string;
  clickable?: boolean;
  hideWhenEmpty?: boolean;
}) {
  // Hooks toujours appelés, pas de conditionnel
  const items = React.useMemo(() => buildWhatsNextItems(input), [input]);
  const visible = !(hideWhenEmpty && items.length === 0);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.section
          key="whats-next"
          layout
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "border-border bg-primary/5 overflow-hidden rounded-2xl border shadow-sm",
            className,
          )}
        >
          <div className="p-4 sm:p-5">
            <div className="space-y-1">
              <h2 className="text-foreground text-lg font-semibold">{title}</h2>
              {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
            </div>

            <motion.div layout className="mt-4 grid gap-3 md:grid-cols-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.key}
                    layout
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <WhatsNextCard item={item} onClick={onItemClick} clickable={clickable} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
