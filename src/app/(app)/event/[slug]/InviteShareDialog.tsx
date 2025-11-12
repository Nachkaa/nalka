"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy } from "lucide-react";

const DEFAULT_USES = 50;
const DEFAULT_TTL_MINUTES = 60 * 24 * 7; // 7 jours

export function InviteShareDialog({ eventRef }: { eventRef: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // info renvoyée par l’API (capée selon capacité restante)
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generate() {
    setLoading(true);
    setErr(null);
    setCopied(false);
    try {
      const r = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventRef,
          uses: DEFAULT_USES,
          ttlMinutes: DEFAULT_TTL_MINUTES,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur");
      setUrl(j.url as string);
      if (typeof j.remainingUses === "number") setRemaining(j.remainingUses);
      if (j.expiresAt) setExpiresAt(new Date(j.expiresAt));
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hint = (() => {
    const n = remaining ?? DEFAULT_USES;
    const people = n > 1 ? "personnes" : "personne";
    const when = expiresAt
      ? `Expire le ${expiresAt.toLocaleString()}`
      : "Expire dans 7 jours";
    return `Jusqu’à ${n} ${people} • ${when}.`;
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full px-3"
          data-button
          aria-label="Partager un lien d’invitation"
        >
          <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Partager
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter des proches</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Génération du lien…</p>
          ) : err ? (
            <p className="text-sm text-destructive">Erreur : {err}</p>
          ) : (
            <>
              <label htmlFor="invite-url" className="text-sm">Partage ce lien</label>
              <div className="flex gap-2">
                <Input id="invite-url" value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" variant="secondary" onClick={copy} aria-label="Copier le lien d’invitation">
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
          <Button onClick={generate} disabled={loading}>Régénérer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
