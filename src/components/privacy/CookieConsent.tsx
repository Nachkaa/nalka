"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Consent = "granted" | "denied" | "unset";
const KEY = "cookie.consent";
const MAX_AGE_MONTHS = 6;

export function CookieConsent() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
  const [consent, setConsent] = useState<Consent>("unset");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const { v, ts } = JSON.parse(raw) as { v: Consent; ts: number };
    const expired = Date.now() - ts > MAX_AGE_MONTHS * 30 * 24 * 60 * 60 * 1000;
    if (!expired) {
      setConsent(v);
      if (v !== "unset") window.dispatchEvent(new CustomEvent("nalka:consent", { detail: { consent: v } }));
    } else {
      setConsent("unset");
      localStorage.removeItem(KEY);
    }
  }, []);

  if (!enabled || consent !== "unset") return null;

  const save = (v: Consent) => {
    localStorage.setItem(KEY, JSON.stringify({ v, ts: Date.now() }));
    setConsent(v);
    window.dispatchEvent(new CustomEvent("nalka:consent", { detail: { consent: v } }));
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-4 p-4">
        <p className="text-sm">
          Nous utilisons des cookies d’audience. Acceptez ou refusez. Vous pourrez changer d’avis à tout moment.
          Voir <a href="/legal/cookies" className="underline">Cookies</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => save("denied")} aria-label="Refuser">Refuser</Button>
          <Button size="sm" onClick={() => save("granted")} aria-label="Accepter">Accepter</Button>
        </div>
      </div>
    </div>
  );
}
