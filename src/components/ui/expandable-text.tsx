"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  maxLines?: 1 | 2 | 3 | 4;
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
  const [showToggle, setShowToggle] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // si le texte non expand a plus de hauteur que ce qu'on voit → overflow
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      setShowToggle(hasOverflow);
    };

    // on force l’état "non expand" pour mesurer la version clampée
    setExpanded(false);
    // wait next paint
    requestAnimationFrame(checkOverflow);

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={textRef}
        className={cn(
          "leading-snug text-muted-foreground",
          !expanded &&
            (maxLines === 1
              ? "line-clamp-1"
              : maxLines === 2
              ? "line-clamp-2"
              : "line-clamp-3"),
          className
        )}
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
