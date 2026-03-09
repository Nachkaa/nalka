// FILE: src/components/privacy/CookieConsent.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Consent = "granted" | "denied" | "unset";
const KEY = "cookie.consent";
const MAX_AGE_MONTHS = 6;

function readStoredConsent(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return "unset";

    const { v, ts } = JSON.parse(raw) as { v: Consent; ts: number };
    const expired = Date.now() - ts > MAX_AGE_MONTHS * 30 * 24 * 60 * 60 * 1000;

    if (expired) {
      localStorage.removeItem(KEY);
      return "unset";
    }

    return v;
  } catch {
    return "unset";
  }
}

export function CookieConsent() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";

  const [consent, setConsent] = useState<Consent>(() => {
    if (typeof window === "undefined") return "unset";
    return readStoredConsent();
  });

  // Optionnel mais utile : au montage, on publie l'état existant si déjà choisi.
  useEffect(() => {
    if (!enabled) return;
    if (consent === "unset") return;

    window.dispatchEvent(new CustomEvent("nalka:consent", { detail: { consent } }));
  }, [enabled, consent]);

  if (!enabled || consent !== "unset") return null;

  const save = (v: Consent) => {
    localStorage.setItem(KEY, JSON.stringify({ v, ts: Date.now() }));
    setConsent(v);
    window.dispatchEvent(new CustomEvent("nalka:consent", { detail: { consent: v } }));
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-4 p-4">
        <p className="text-sm">
          Nous utilisons des cookies d’audience. Acceptez ou refusez. Vous pourrez changer d’avis à
          tout moment. Voir{" "}
          <a href="/legal/cookies" className="underline">
            Cookies
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => save("denied")} aria-label="Refuser">
            Refuser
          </Button>
          <Button size="sm" onClick={() => save("granted")} aria-label="Accepter">
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
