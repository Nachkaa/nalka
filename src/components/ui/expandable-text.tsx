"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  maxLines?: 1 | 2 | 3;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
};

export default function ExpandableText({
  text,
  maxLines = 2,
  className,
  moreLabel = "Voir plus",
  lessLabel = "Voir moins",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 120; // simple heuristic to show the toggle

  return (
    <div>
      <p
        className={cn(
          "leading-snug text-muted-foreground",
          !expanded && (maxLines === 1 ? "line-clamp-1" : maxLines === 2 ? "line-clamp-2" : "line-clamp-3"),
          className
        )}
      >
        {text}
      </p>

      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs underline underline-offset-2"
          aria-expanded={expanded}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
