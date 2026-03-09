// FILE: src/app/(app)/event/[slug]/_components/ModuleTeaser.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ModuleTeaserProps = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
};

export function ModuleTeaser({
  Icon,
  title,
  description,
  onClick,
  loading = false,
  disabled = false,
}: ModuleTeaserProps) {
  const isDisabled = disabled || loading;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "rounded-full border bg-[var(--secondary)]/60 px-3 py-2",
        "text-sm",
        isDisabled && "opacity-70",
      )}
      aria-busy={loading || undefined}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--foreground)]/80" aria-hidden="true" />
        <div className="flex flex-col leading-tight">
          <span className="truncate font-medium">{title}</span>
          <span className="text-muted-foreground hidden truncate text-[10px] sm:block">
            {description}
          </span>
        </div>
      </div>

      <Button
        size="sm"
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => void onClick()}
        disabled={isDisabled}
        aria-disabled={isDisabled}
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Activation…
          </>
        ) : (
          "Activer"
        )}
      </Button>
    </div>
  );
}
