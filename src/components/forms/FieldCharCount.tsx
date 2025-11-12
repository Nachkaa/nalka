"use client";

import { useEffect, useState } from "react";

export default function FieldCharCount({ forId, max }: { forId: string; max: number }) {
  const [len, setLen] = useState(0);

  useEffect(() => {
    const el = document.getElementById(forId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) return;
    const onInput = () => setLen(el.value.length);
    onInput();
    el.addEventListener("input", onInput);
    return () => el.removeEventListener("input", onInput);
  }, [forId]);

  return <div className="text-xs text-muted-foreground text-right">{len}/{max}</div>;
}
