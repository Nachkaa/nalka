"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { key: "summary", label: "Vue d'ensemble", href: (slug: string) => `/event/${slug}/budget` },
  { key: "lines", label: "Postes", href: (slug: string) => `/event/${slug}/budget/lines` },
  { key: "quotes", label: "Devis", href: (slug: string) => `/event/${slug}/budget/quotes` },
] as const;

export function BudgetLocalNav(props: { eventSlug: string; hasLines: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation du budget" className="border-border border-b bg-white">
      <div className="flex gap-2 overflow-x-auto py-2">
        {LINKS.map((link) => {
          const href = link.href(props.eventSlug);
          const isActive =
            pathname === href || (link.key === "quotes" && pathname.startsWith(`${href}/`));
          const isDisabled = link.key === "quotes" && !props.hasLines && !isActive;

          if (isDisabled) {
            return (
              <span
                key={link.key}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
                  "cursor-not-allowed opacity-60",
                  "text-muted-foreground bg-muted/60",
                )}
                aria-disabled="true"
                title="Ajoute d'abord un poste budgetaire pour gerer des devis."
              >
                {link.label}
              </span>
            );
          }

          return (
            <Link
              key={link.key}
              href={href}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
