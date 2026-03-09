// StepperHeader.tsx
"use client";

import { cn } from "@/lib/utils";

export type StepDef = {
  key: string;
  chip: string; // label court (Type, Titre...)
  title: string; // titre long (utilisé dans le contenu, pas ici)
};

type Props = {
  steps: readonly StepDef[];
  step: number;
  withinStep?: number;
  onStepChange?: (next: number) => void;
  disabled?: boolean;
};

export function StepperHeader({ steps, step, withinStep, onStepChange, disabled }: Props) {
  const total = steps.length;

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const within = clamp01(withinStep ?? 0.5);

  // Position sur le rail (0..100) : alignée avec les pastilles
  const posPct = (i: number) => {
    if (total <= 1) return 0;
    return (i / (total - 1)) * 100;
  };
  const fillPct =
    total <= 1 ? 0 : Math.max(0, Math.min(100, ((step + within) / (total - 1)) * 100));

  return (
    <div className="bg-background/80 sticky top-0 z-20 -mx-4 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Rail + nodes */}
        <div className="relative pb-2">
          {/* Rail */}
          <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-200"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          {/* Nodes */}
          <div className="absolute top-0 right-0 left-0 h-2">
            {steps.map((s, i) => {
              const isCurrent = i === step;
              const isDone = i < step;
              const isFuture = i > step;

              const clickable = !!onStepChange && isDone && !disabled;

              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStepChange?.(i)}
                  aria-label={s.chip}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "group absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs transition",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",

                    // DONE + CURRENT = identique (plein)
                    (isDone || isCurrent) && "bg-primary text-primary-foreground",

                    // FUTURE = neutre
                    isFuture && "bg-background text-muted-foreground/70 border-muted-foreground/30",

                    // halo uniquement sur CURRENT (facultatif)
                    isCurrent && "ring-primary ring-offset-0.5 ring-offset-background ring-2",

                    // ✅ cursor
                    clickable ? "cursor-pointer" : "cursor-default",

                    // ✅ hover uniquement si clickable
                    clickable && "hover:bg-accent hover:text-accent-foreground",
                  )}
                  style={{ left: `${posPct(i)}%` }}
                >
                  {i + 1}

                  {/* Tooltip (desktop) */}
                  <span className="bg-background text-foreground pointer-events-none absolute -bottom-8 left-1/2 hidden -translate-x-1/2 rounded-md border px-2 py-1 text-[11px] shadow-sm group-hover:block">
                    {s.chip}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
