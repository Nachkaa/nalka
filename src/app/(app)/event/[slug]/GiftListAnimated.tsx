"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReserveButton from "./ReserveButton";
import { Link2 } from "lucide-react";
import ExpandableText from "@/components/ui/expandable-text";

export type GiftItemVM = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  /** taken by someone else (not me) */
  isTakenByOther: boolean;
  /** reserved by me */
  isMine: boolean;
  /** name/email if not anonymous and taken by other */
  reservedByName: string | null;
};

export default function GiftListAnimated({
  items,
  eventId,
  showNames,
}: {
  items: GiftItemVM[];
  eventId: string;
  showNames: boolean;
}) {
  const [local, setLocal] = useState(items);

  useEffect(() => {
    setLocal(items);
  }, [items]);

  // mine → free → takenByOther
  const ordered = useMemo(() => {
    const rank = (it: GiftItemVM) => (it.isMine ? 0 : it.isTakenByOther ? 2 : 1);
    return [...local].sort((a, b) => {
      const d = rank(a) - rank(b);
      return d !== 0 ? d : a.title.localeCompare(b.title, "fr");
    });
  }, [local]);

  function handleOptimisticChange(itemId: string, nextIsMine: boolean) {
    setLocal((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              isMine: nextIsMine,
              isTakenByOther: nextIsMine ? false : it.isTakenByOther,
            }
          : it,
      ),
    );
  }

  const getDomain = (url?: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "lien";
    }
  };

  return (
    <motion.ul layout className="mt-2 space-y-1">
    {ordered.map((it) => (
      <motion.li
        key={it.id}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.7 }}
        className={`
          grid gap-2 border-b py-2 text-sm transition-opacity
          md:flex md:items-start md:justify-between md:gap-3
          ${it.isMine ? "font-bold" : ""} ${it.isTakenByOther && !it.isMine ? "opacity-60" : ""}
        `}
      >
        {/* Left column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate">{it.title}</span>
            {it.url && (
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--sidebar-primary)] hover:underline"
                title={`Ouvrir le lien (${getDomain(it.url)})`}
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{getDomain(it.url)}</span>
              </a>
            )}
          </div>
          
          {it.note && (
            <ExpandableText text={it.note} maxLines={2} className="mt-1 text-xs" />
          )}
        </div>
        
        {/* Desktop CTA (right) */}
        <div className="hidden md:block md:pl-4">
          <ReserveButton
            key={`${it.id}-${it.reservedByName ? "anon" : "named"}`}
            itemId={it.id}
            eventId={eventId}
            initialIsMine={it.isMine}
            initialTakenByOther={it.isTakenByOther}
            reservedByName={it.reservedByName}
            onOptimisticChange={(next) => handleOptimisticChange(it.id, next)}
          />
        </div>
        
        {/* Mobile CTA (full width below) */}
        <div className="md:hidden">
          <ReserveButton
            key={`m-${it.id}-${it.reservedByName ? "anon" : "named"}`}
            itemId={it.id}
            eventId={eventId}
            initialIsMine={it.isMine}
            initialTakenByOther={it.isTakenByOther}
            reservedByName={it.reservedByName}
            onOptimisticChange={(next) => handleOptimisticChange(it.id, next)}
            className="w-full"
          />
        </div>
      </motion.li>
    ))}
  </motion.ul>
    );
}
