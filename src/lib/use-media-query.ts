"use client";

import { useEffect, useState } from "react";

/**
 * Simple media query hook.
 * Returns true if the query matches on the client; defaults to false during SSR.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);

    // Set initial value
    listener();

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
