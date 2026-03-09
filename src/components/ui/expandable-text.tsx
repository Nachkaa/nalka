// src/components/ui/expandable-text.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  maxLines?: 1 | 2 | 3 | 4;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
};

function ExpandableTextInner({
  text,
  maxLines,
  className,
  moreLabel,
  lessLabel,
}: Required<Pick<Props, "text" | "maxLines" | "moreLabel" | "lessLabel">> &
  Pick<Props, "className">) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // mesure en "non expand" uniquement, car ce composant est remount à chaque changement text/maxLines
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      setShowToggle(hasOverflow);
    };

    // after paint
    requestAnimationFrame(checkOverflow);

    const ro = new ResizeObserver(() => checkOverflow());
    ro.observe(el);

    return () => ro.disconnect();
  }, [text, maxLines]);

  const clampClass =
    maxLines === 1
      ? "line-clamp-1"
      : maxLines === 2
        ? "line-clamp-2"
        : maxLines === 3
          ? "line-clamp-3"
          : "line-clamp-4";

  return (
    <div>
      <p
        ref={textRef}
        className={cn("text-muted-foreground leading-snug", !expanded && clampClass, className)}
      >
        {text}
      </p>

      {showToggle && (
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

export default function ExpandableText({
  text,
  maxLines = 2,
  className,
  moreLabel = "Voir plus",
  lessLabel = "Voir moins",
}: Props) {
  // force remount quand le contenu ou le clamp change => expanded revient à false sans useEffect
  const resetKey = useMemo(() => `${maxLines}:${text}`, [maxLines, text]);

  return (
    <ExpandableTextInner
      key={resetKey}
      text={text}
      maxLines={maxLines}
      className={className}
      moreLabel={moreLabel}
      lessLabel={lessLabel}
    />
  );
}
